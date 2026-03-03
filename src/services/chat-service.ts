/**
 * Chat Service
 * Handles message interactions for a specific session
 */

import type {
  Message,
  StreamChunkToolUse,
  OpencodeService,
} from "./opencode-service";
import type {
  CreateSessionResult,
  Session,
  SessionManager,
} from "./session-manager";

export interface StreamResponseHandlers {
  onContentDelta?: (text: string) => void | Promise<void>;
  onThinkingDelta?: (text: string) => void;
  onToolUse?: (chunk: StreamChunkToolUse) => void;
  onError?: (error: string) => void;
}

export interface StreamResponseOptions {
  signal?: AbortSignal;
}

export class ChatService {
  private opencodeService: OpencodeService;
  private sessionManager: SessionManager;

  constructor(
    opencodeService: OpencodeService,
    sessionManager: SessionManager,
  ) {
    this.opencodeService = opencodeService;
    this.sessionManager = sessionManager;
  }

  /**
   * Ensure there is an active session; create one when absent
   */
  async ensureActiveSession(): Promise<CreateSessionResult> {
    const active = this.sessionManager.getActiveSession();
    if (active) {
      return { session: active };
    }
    return this.sessionManager.createSession();
  }

  /**
   * Add a user message to session history
   */
  addUserMessage(sessionId: string, content: string): Message | null {
    const session = this.sessionManager.getSession(sessionId);
    if (!session) {
      return null;
    }

    const message: Message = {
      role: "user",
      content,
      timestamp: Date.now(),
    };
    this.sessionManager.addMessage(sessionId, message);
    return message;
  }

  /**
   * Stream assistant response for a specific session and persist final text message
   */
  async streamAssistantResponse(
    session: Session,
    prompt: string,
    handlers: StreamResponseHandlers = {},
    options: StreamResponseOptions = {},
  ): Promise<Message | null> {
    const stream = await this.opencodeService.sendPrompt(session.id, prompt);
    if (!stream) {
      handlers.onError?.("Failed to send message");
      return null;
    }

    const signal = options.signal;
    let fullContent = "";
    const toolOrder: string[] = [];
    const toolState = new Map<string, StreamChunkToolUse>();

    try {
      for await (const chunk of stream) {
        if (signal?.aborted) {
          break;
        }

        if (chunk.type === "content" && chunk.text) {
          fullContent += chunk.text;
          await handlers.onContentDelta?.(chunk.text);
        } else if (chunk.type === "thinking" && chunk.text) {
          handlers.onThinkingDelta?.(chunk.text);
        } else if (chunk.type === "tool_use") {
          if (!toolState.has(chunk.partId)) {
            toolOrder.push(chunk.partId);
          }
          const previous = toolState.get(chunk.partId);
          toolState.set(
            chunk.partId,
            previous ? { ...previous, ...chunk } : chunk,
          );
          handlers.onToolUse?.(chunk);
        } else if (chunk.type === "error") {
          handlers.onError?.(chunk.error || "Unknown error");
        }
      }
    } catch (error) {
      if (!signal?.aborted) {
        const message = error instanceof Error ? error.message : String(error);
        handlers.onError?.(message);
      }
      return null;
    }

    if (!fullContent || signal?.aborted) {
      return null;
    }

    const assistantMessage: Message = {
      role: "assistant",
      content: fullContent,
      timestamp: Date.now(),
      tools: toolOrder
        .map((partId) => toolState.get(partId))
        .filter((tool): tool is StreamChunkToolUse => tool !== undefined),
    };
    this.sessionManager.addMessage(session.id, assistantMessage);
    return assistantMessage;
  }

  /**
   * Abort a running session request
   */
  async abortSession(sessionId: string): Promise<boolean> {
    return this.opencodeService.abortSession(sessionId);
  }
}
