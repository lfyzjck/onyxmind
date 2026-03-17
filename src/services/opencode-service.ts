/**
 * OpenCode Service
 * Encapsulates OpenCode SDK functionality
 */

import { Notice, App, FileSystemAdapter } from "obsidian";
import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";
import {
  createOpencodeServerPatched,
  type PatchedServerOptions,
} from "../utils/opencode-server";
import { execSync } from "child_process";
import { isProviderConfigured, type OnyxMindSettings } from "../settings";
import { findOpencodeExecutable, getEnhancedPath } from "../utils/env";
import { buildAgentPrompt } from "./agent-prompt";
import type {
  ApiError,
  ProviderAuthError,
  UnknownError,
  MessageOutputLengthError,
  MessageAbortedError,
  StructuredOutputError,
  ContextOverflowError,
  OpencodeClient,
  Session,
  Command,
  Part,
  TextPart,
  ReasoningPart,
} from "@opencode-ai/sdk/v2";

// Network / server config
const SERVER_HOSTNAME = "127.0.0.1";
const OBSIDIAN_CORS_ORIGIN = "app://obsidian.md";

// Error messages
const ERROR_CLIENT_NOT_INITIALIZED = "OpenCode client not initialized";

// SDK message part types
const PART_TYPE_TEXT = "text";
const PART_TYPE_REASONING = "reasoning";
const PART_TYPE_TOOL = "tool";

type OpencodeServerInstance = Awaited<
  ReturnType<typeof createOpencodeServerPatched>
>;

function getVaultBasePath(app: App): string {
  if (app.vault.adapter instanceof FileSystemAdapter) {
    return app.vault.adapter.getBasePath();
  } else {
    // not support mobile device
    throw new Error("Mobile device not supported");
  }
}

type SessionError =
  | ProviderAuthError
  | UnknownError
  | MessageOutputLengthError
  | MessageAbortedError
  | StructuredOutputError
  | ContextOverflowError
  | ApiError;

function extractErrorMessage(err: SessionError): string {
  switch (err.name) {
    case "ProviderAuthError":
      return `Provider auth error (${err.data.providerID}): ${err.data.message}`;
    case "UnknownError":
      return err.data.message;
    case "MessageOutputLengthError":
      return "Response was cut off because the output length limit was reached.";
    case "MessageAbortedError":
      return err.data.message;
    case "StructuredOutputError":
      return `Structured output error (retried ${err.data.retries}x): ${err.data.message}`;
    case "ContextOverflowError":
      return err.data.message;
    case "APIError": {
      const status = err.data.statusCode ? ` [${err.data.statusCode}]` : "";
      return `API error${status}: ${err.data.message}`;
    }
  }
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  error?: string;
  tools?: StreamChunkToolUse[];
  hasThinking?: boolean;
  displayContent?: string;
}

export interface AvailableCommand {
  name: string;
  description: string;
  source: "command" | "mcp" | "skill";
  template: string;
}

/** Incremental text content from the assistant */
export interface StreamChunkContent {
  type: "content";
  text: string;
}

/** Reasoning / thinking text from the model */
export interface StreamChunkThinking {
  type: "thinking";
  text: string;
}

/** Tool invocation (may fire multiple times as state changes) */
export interface StreamChunkToolUse {
  type: "tool_use";
  partId: string;
  tool: string;
  status: "pending" | "running" | "completed" | "error";
  input?: Record<string, unknown>;
  title?: string; // running / completed
  output?: string; // completed
  error?: string; // error
  questionId?: string; // for question tools: the que_xxx ID needed to reply
  permissionId?: string; // for permission requests: the per_xxx ID needed to reply
  permissionType?: string; // e.g. "edit", "read", "bash"
  permissionPatterns?: string[]; // affected file patterns
  permissionMetadata?: Record<string, unknown>; // includes filepath, diff, etc.
}

/** A recoverable or fatal error occurred during generation */
export interface StreamChunkError {
  type: "error";
  error: string;
}

export type StreamChunk =
  | StreamChunkContent
  | StreamChunkThinking
  | StreamChunkToolUse
  | StreamChunkError;

export class OpencodeService {
  private _client: OpencodeClient | null = null;
  private settings: OnyxMindSettings;
  private app: App;
  private server: OpencodeServerInstance | null = null;
  private abortController: AbortController | null = null;
  private vaultPath: string;

  private port = 4096;

  private get client(): OpencodeClient {
    if (!this._client) throw new Error(ERROR_CLIENT_NOT_INITIALIZED);
    return this._client;
  }

  constructor(app: App, settings: OnyxMindSettings) {
    this.app = app;
    this.settings = settings;
    this.vaultPath = getVaultBasePath(app);
    console.debug(
      "[OnyxMind] OpencodeService constructor, vaultPath:",
      this.vaultPath,
    );
  }

  /**
   * Kill any process occupying the configured port
   */
  private killPortProcess(): void {
    try {
      const result = execSync(`lsof -ti tcp:${this.port}`, {
        encoding: "utf-8",
      }).trim();
      if (result) {
        const pids = result
          .split("\n")
          .map((p) => p.trim())
          .filter(Boolean);
        for (const pid of pids) {
          try {
            execSync(`kill -9 ${pid}`);
            console.debug(
              `[OnyxMind] Killed residual process ${pid} on port ${this.port}`,
            );
          } catch {
            /* already dead */
          }
        }
      }
    } catch {
      /* no process on port, that's fine */
    }
  }

  /**
   * Initialize the OpenCode client and server
   * Based on tests/sse-prompt-test.js initialization pattern
   */
  async initialize(): Promise<boolean> {
    try {
      console.debug("[OnyxMind] Initializing OpenCode with full server...");

      // Kill any residual process from a previous session
      this.killPortProcess();
      // Enhance PATH so the opencode binary can be found in GUI app environment
      process.env.PATH = getEnhancedPath();
      // Enable Exa web search tool
      process.env.OPENCODE_ENABLE_EXA = "1";

      const execPath = findOpencodeExecutable();
      if (!execPath) {
        const msg =
          "opencode binary not found. Please install opencode and ensure it is on your PATH.";
        new Notice(msg);
        console.error("[OnyxMind]", msg);
        return false;
      }
      console.debug("[OnyxMind] Found opencode at:", execPath);

      this.abortController = new AbortController();

      // Build the Obsidian-aware system prompt for the build agent
      const agentPrompt = buildAgentPrompt({ vaultPath: this.vaultPath });

      // 1. Start the server (patched version; CORS origins passed via --cors flag)
      // Build provider config map from all configured providers
      const providerConfigMap: Record<string, object> = {};
      for (const p of this.settings.providers) {
        if (!isProviderConfigured(p)) continue;
        providerConfigMap[p.id] = {
          models: Object.fromEntries(
            p.models.map((m) => [m.modelId, { name: m.modelId }]),
          ),
          options: {
            apiKey: p.apiKey,
            ...(p.apiBase ? { baseURL: p.apiBase } : {}),
          },
        };
      }

      const serverResult = await createOpencodeServerPatched({
        hostname: SERVER_HOSTNAME,
        port: this.port,
        signal: this.abortController.signal,
        config: {
          model: this.settings.activeModelId,
          server: {
            cors: [OBSIDIAN_CORS_ORIGIN],
          },
          provider: providerConfigMap,
          permission: {
            websearch: "allow",
            edit: "ask",
          },
          agent: {
            build: {
              prompt: agentPrompt,
            },
          },
          skills: {
            urls: [
              "https://github.com/kepano/obsidian-skills/tree/main/skills",
            ],
          },
        } as PatchedServerOptions["config"],
      });

      this.server = serverResult;

      // 2. 创建 client，连接到 server
      this._client = createOpencodeClient({
        baseUrl: serverResult.url,
        directory: this.vaultPath,
      });

      console.debug("[OnyxMind] OpenCode initialized successfully");
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`Failed to initialize OpenCode: ${message}`);
      console.error("[OnyxMind Error] OpenCode initialization error:", error);
      return false;
    }
  }

  /**
   * Destroy the OpenCode server synchronously
   * Safe to call from onunload() which is synchronous
   */
  destroy(): void {
    console.debug("[OnyxMind] Destroying OpenCode server...");
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.server) {
      try {
        this.server.close();
      } catch {
        /* proc already killed by abort */
      }
      this.server = null;
    }
    this._client = null;
    // Fallback: force-kill anything still on the port
    this.killPortProcess();
  }

  /**
   * Check if the service is initialized
   */
  isInitialized(): boolean {
    return this._client !== null;
  }

  /**
   * Get current vault path used for OpenCode directory scoping
   */
  getVaultPath(): string {
    return this.vaultPath;
  }

  /**
   * List sessions under current vault directory scope.
   * When limit is provided, returns the most recently updated N sessions.
   */
  async listSessions(limit?: number): Promise<Session[] | null> {
    try {
      const response = await this.client.session.list({
        directory: this.vaultPath,
      });
      const all = response.data ?? [];
      if (limit !== undefined) {
        return all
          .sort((a, b) => b.time.updated - a.time.updated)
          .slice(0, limit);
      }
      return all;
    } catch (error) {
      console.error("[OnyxMind] Failed to list sessions:", error);
      return null;
    }
  }

  /**
   * List available slash commands under current vault directory scope
   */
  async listCommands(): Promise<AvailableCommand[] | null> {
    try {
      const response = await this.client.command.list({
        directory: this.vaultPath,
      });

      if (!response.data) return [];

      return response.data
        .map(
          (item: Command): AvailableCommand => ({
            name: item.name,
            description: item.description ?? "",
            source: item.source ?? "command",
            template: item.template,
          }),
        )
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("[OnyxMind] Failed to list commands:", error);
      return null;
    }
  }

  /**
   * Load message history for a specific session in the current vault scope
   */
  async getSessionMessages(sessionId: string): Promise<Message[] | null> {
    try {
      const response = await this.client.session.messages({
        sessionID: sessionId,
        directory: this.vaultPath,
        limit: Math.max(1, this.settings.maxHistoryMessages),
      });

      if (!response.data) return [];

      const messages = response.data
        .map((entry): Message | null => {
          const info = entry.info;
          const role = info.role === "assistant" ? "assistant" : "user";
          const timestamp = info.time.created;
          const parts = entry.parts;
          const reasoning = this.extractReasoningText(parts);
          const hasReasoningText = reasoning.trim().length > 0;
          const content = this.extractMessageText(parts);
          const tools =
            role === "assistant" ? this.extractToolParts(parts) : [];

          let error: string | undefined;
          if (info.role === "assistant" && info.error) {
            error = extractErrorMessage(info.error);
          }

          if (!content && !error && tools.length === 0) {
            return null;
          }

          return {
            role,
            content,
            timestamp,
            error,
            tools: tools.length > 0 ? tools : undefined,
            hasThinking:
              role === "assistant" && hasReasoningText ? true : undefined,
          };
        })
        .filter((message): message is Message => message !== null)
        .sort((a, b) => a.timestamp - b.timestamp);

      return messages;
    } catch (error) {
      console.error("[OnyxMind] Failed to load session messages:", error);
      return null;
    }
  }

  private extractMessageText(parts: Part[]): string {
    const text = parts
      .filter((p): p is TextPart => p.type === PART_TYPE_TEXT)
      .map((p) => p.text)
      .join("");

    if (text) return text;

    const reasoning = this.extractReasoningText(parts);
    return reasoning.trim() ? reasoning : "";
  }

  private extractReasoningText(parts: Part[]): string {
    return parts
      .filter((p): p is ReasoningPart => p.type === PART_TYPE_REASONING)
      .map((p) => p.text)
      .join("");
  }

  private extractToolParts(parts: Part[]): StreamChunkToolUse[] {
    const tools: StreamChunkToolUse[] = [];
    for (const part of parts) {
      if (part.type !== PART_TYPE_TOOL) continue;

      const state = part.state;
      const chunk: StreamChunkToolUse = {
        type: "tool_use",
        partId: part.id,
        tool: part.tool,
        status: state.status,
        input: state.input,
      };

      if (state.status === "running" && state.title) chunk.title = state.title;
      if (state.status === "completed") {
        chunk.title = state.title;
        chunk.output = state.output;
      }
      if (state.status === "error") chunk.error = state.error;

      tools.push(chunk);
    }
    return tools;
  }

  /**
   * Create a new session
   */
  async createSession(title?: string): Promise<string | null> {
    try {
      console.debug("[OnyxMind] Creating session:", title);

      const response = await this.client.session.create({
        title: title,
        directory: this.vaultPath,
      });

      if (!response?.data) {
        const error = "Failed to create session: Invalid response structure";
        console.error("[OnyxMind]", error, "Response:", response);
        new Notice(error);
        return null;
      }

      console.debug(
        "[OnyxMind] Session created successfully:",
        response.data.id,
      );
      return response.data.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[OnyxMind] Session creation error:", error);
      new Notice(`Failed to create session: ${message}`);
      return null;
    }
  }

  /**
   * Send a prompt to a session with streaming response
   * Uses async prompt + SSE event stream pattern from tests/sse-prompt-test.js
   * Returns an async iterator for streaming responses
   */
  async sendPrompt(
    sessionId: string,
    prompt: string,
  ): Promise<AsyncIterableIterator<StreamChunk> | null> {
    try {
      console.debug("[OnyxMind] Sending prompt to session:", sessionId);
      console.debug("[OnyxMind] Prompt:", prompt.substring(0, 100) + "...");

      // Send async prompt (non-blocking)
      await this.client.session.promptAsync({
        sessionID: sessionId,
        parts: [{ type: PART_TYPE_TEXT, text: prompt }],
        model: {
          providerID: this.settings.activeProviderId,
          modelID: this.settings.activeModelId,
        },
      });

      console.debug("[OnyxMind] Async prompt sent, subscribing to events...");

      // Subscribe to SSE events and stream the response
      return this.streamResponseFromEvents(sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[OnyxMind] Prompt error:", error);
      new Notice(`Failed to send prompt: ${message}`);
      return null;
    }
  }

  /**
   * Stream response from SSE events.
   *
   * Event → StreamChunk mapping:
   *   message.part.updated (text/delta)   → StreamChunkContent
   *   message.part.updated (reasoning)    → StreamChunkThinking
   *   message.part.updated (tool)         → StreamChunkToolUse
   *   question.asked                      → StreamChunkToolUse (with questionId)
   *   session.error                       → StreamChunkError
   *   message.updated (assistant w/error) → StreamChunkError
   *   session.idle                        → end of stream
   */
  private async *streamResponseFromEvents(
    sessionId: string,
  ): AsyncIterableIterator<StreamChunk> {
    try {
      const events = await this.client.event.subscribe();

      if (!events || !events.stream) {
        yield { type: "error", error: "No event stream available" };
        return;
      }

      console.debug(
        "[OnyxMind] Event stream subscribed, waiting for responses...",
      );

      let isIdle = false;
      // Track the current assistant message so we only emit parts that belong to it.
      let assistantMessageId: string | null = null;
      // Track callID → partId mapping for question tools
      const callIdToPartId = new Map<string, string>();

      for await (const event of events.stream) {
        switch (event.type) {
          // ── Message lifecycle ─────────────────────────────────────────
          case "message.updated": {
            const info = event.properties.info;
            if (info.sessionID !== sessionId) break;

            if (info.role === "assistant") {
              assistantMessageId = info.id;

              // Only report error when the message is completed (time.completed set)
              if (info.error && typeof info.time.completed === "number") {
                yield {
                  type: "error",
                  error: extractErrorMessage(info.error),
                };
              }
            }
            break;
          }

          // ── Streaming part updates ────────────────────────────────────
          case "message.part.updated": {
            const part = event.properties.part;
            if (part.sessionID !== sessionId) break;
            if (assistantMessageId && part.messageID !== assistantMessageId)
              break;

            // delta carries the incremental text; use full text as fallback
            const delta = event.properties.delta;

            if (part.type === PART_TYPE_TEXT) {
              const text = delta ?? part.text;
              if (text) yield { type: "content", text };
            } else if (part.type === PART_TYPE_REASONING) {
              const text = delta ?? part.text;
              if (text) yield { type: "thinking", text };
            } else if (part.type === PART_TYPE_TOOL) {
              const state = part.state;

              // Track callID → partId for question and permission tools
              if (part.callID) {
                callIdToPartId.set(part.callID, part.id);
              }

              const chunk: StreamChunkToolUse = {
                type: "tool_use",
                partId: part.id,
                tool: part.tool,
                status: state.status,
                input: state.input,
              };
              if (state.status === "running" && state.title)
                chunk.title = state.title;
              if (state.status === "completed") {
                chunk.title = state.title;
                chunk.output = state.output;
              }
              if (state.status === "error") chunk.error = state.error;
              yield chunk;
            }
            break;
          }

          // ── Session-level error (API / auth / etc.) ───────────────────
          case "session.error": {
            if (
              event.properties.sessionID &&
              event.properties.sessionID !== sessionId
            )
              break;
            if (event.properties.error) {
              yield {
                type: "error",
                error: extractErrorMessage(event.properties.error),
              };
            }
            break;
          }

          // ── Question asked ────────────────────────────────────────────
          case "question.asked": {
            const props = event.properties;
            if (props.sessionID !== sessionId) break;

            // Find the corresponding tool part via callID
            const callId = props.tool?.callID;
            const partId = callId ? callIdToPartId.get(callId) : null;

            if (partId) {
              // Emit an update to the existing tool chunk with questionId
              yield {
                type: "tool_use",
                partId,
                tool: "question",
                status: "running",
                questionId: props.id,
              };
            }
            break;
          }

          // ── Permission asked ──────────────────────────────────────────
          case "permission.asked": {
            const props = event.properties;
            if (props.sessionID !== sessionId) break;

            const callId = props.tool?.callID;
            const partId = callId ? callIdToPartId.get(callId) : null;

            if (partId) {
              yield {
                type: "tool_use",
                partId,
                tool: "permission",
                status: "running",
                permissionId: props.id,
                permissionType: props.permission,
                permissionPatterns: props.patterns,
                permissionMetadata: props.metadata,
              };
            }
            break;
          }

          // ── Stream termination ────────────────────────────────────────
          case "session.idle": {
            if (event.properties.sessionID === sessionId) {
              console.debug("[OnyxMind] Session idle, streaming complete");
              isIdle = true;
            }
            break;
          }

          case "session.status": {
            console.debug(
              "[OnyxMind] Session status:",
              event.properties.status.type,
            );
            break;
          }
        }

        if (isIdle) break;
      }

      console.debug("[OnyxMind] Event stream completed");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[OnyxMind Error] Event stream error:", error);
      yield {
        type: "error",
        error: message,
      };
    }
  }

  /**
   * Abort a running session
   * Sends an interrupt signal to the OpenCode server ([Request interrupted by user])
   */
  async abortSession(sessionId: string): Promise<boolean> {
    try {
      console.debug("[OnyxMind] Aborting session:", sessionId);
      await this.client.session.abort({ sessionID: sessionId });
      console.debug("[OnyxMind] Session aborted:", sessionId);
      return true;
    } catch (error) {
      console.error("[OnyxMind Error] Failed to abort session:", error);
      return false;
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      await this.client.session.delete({
        sessionID: sessionId,
      });
      return true;
    } catch (error) {
      console.error("Session deletion error:", error);
      return false;
    }
  }

  /**
   * Update settings
   */
  updateSettings(settings: OnyxMindSettings): void {
    this.settings = settings;
    // Reinitialize client with new settings
    void this.initialize();
  }

  /**
   * Send prompt asynchronously (non-blocking)
   * Based on tests/sse-prompt-test.js pattern
   */
  async sendPromptAsync(sessionId: string, prompt: string): Promise<boolean> {
    try {
      console.debug("[OnyxMind] Sending async prompt:", {
        sessionId,
        promptLength: prompt.length,
      });

      const response = await this.client.session.promptAsync({
        sessionID: sessionId,
        parts: [{ type: PART_TYPE_TEXT, text: prompt }],
        model: {
          providerID: this.settings.activeProviderId,
          modelID: this.settings.activeModelId,
        },
      });

      console.debug("[OnyxMind] Async prompt sent:", response);
      return true;
    } catch (error) {
      console.error("[OnyxMind Error] Failed to send async prompt:", error);
      return false;
    }
  }

  /**
   * Subscribe to SSE event stream
   * Returns an async iterator of events
   * Based on tests/sse-prompt-test.js pattern
   */
  async subscribeToEvents(): Promise<AsyncIterable<unknown> | null> {
    try {
      console.debug("[OnyxMind] Subscribing to event stream");

      const events = await this.client.event.subscribe();

      if (!events || !events.stream) {
        console.error("[OnyxMind Error] No event stream available");
        return null;
      }

      console.debug("[OnyxMind] Event stream subscribed");
      return events.stream;
    } catch (error) {
      console.error("[OnyxMind Error] Failed to subscribe to events:", error);
      return null;
    }
  }

  /**
   * Reply to a question with user's answers
   * answers: one Array<string> per question (selected option labels), in question order
   */
  async replyToQuestion(
    questionId: string,
    answers: string[][],
  ): Promise<boolean> {
    try {
      console.debug("[OnyxMind] Replying to question:", questionId, answers);

      const response = await this.client.question.reply({
        requestID: questionId,
        answers,
      });

      console.debug("[OnyxMind] Question reply response:", response);
      return true;
    } catch (error) {
      console.error("[OnyxMind Error] Failed to reply to question:", error);
      return false;
    }
  }

  /**
   * Reply to a permission request
   */
  async replyToPermission(
    requestId: string,
    reply: "once" | "always" | "reject",
  ): Promise<boolean> {
    try {
      await this.client.permission.reply({ requestID: requestId, reply });
      return true;
    } catch (error) {
      console.error("[OnyxMind Error] Failed to reply to permission:", error);
      return false;
    }
  }

  /**
   * Summarize a session and return the generated title, or null on failure
   */
  async summarizeSession(sessionId: string): Promise<string | null> {
    try {
      console.debug("[OnyxMind] Summarizing session:", sessionId);

      const response = await this.client.session.summarize({
        sessionID: sessionId,
        directory: this.vaultPath,
      });

      if (!response.data) {
        return null;
      }

      console.debug("[OnyxMind] Summarize response:", response);
      const sessionResponse = await this.client.session.get({
        sessionID: sessionId,
        directory: this.vaultPath,
      });

      return sessionResponse.data?.title ?? null;
    } catch (error) {
      console.error("[OnyxMind Error] Failed to summarize session:", error);
      return null;
    }
  }

  /**
   * Update session metadata (title)
   */
  async updateSession(
    sessionId: string,
    updates: { title?: string },
  ): Promise<boolean> {
    try {
      console.debug("[OnyxMind] Updating session:", sessionId, updates);

      const response = await this.client.session.update({
        sessionID: sessionId,
        directory: this.vaultPath,
        title: updates.title,
      });

      console.debug("[OnyxMind] Session update response:", response);
      return true;
    } catch (error) {
      console.error("[OnyxMind Error] Failed to update session:", error);
      return false;
    }
  }
}
