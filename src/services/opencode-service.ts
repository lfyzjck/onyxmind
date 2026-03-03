/**
 * OpenCode Service
 * Encapsulates OpenCode SDK functionality
 */

import { Notice, App } from 'obsidian';
import { createOpencodeClient } from '@opencode-ai/sdk/v2/client';
import { createOpencodeServerPatched } from '../utils/opencode-server';
import { execSync } from 'child_process';
import type { OnyxMindSettings } from '../settings';
import { findOpencodeExecutable, getEnhancedPath } from '../utils/env';
import { buildAgentPrompt } from './agent-prompt';
import type {
	ApiError,
	ProviderAuthError,
	UnknownError,
	MessageOutputLengthError,
	MessageAbortedError,
	StructuredOutputError,
	ContextOverflowError,
	OpencodeClient,
} from '@opencode-ai/sdk/v2';

// Network / server config
const SERVER_HOSTNAME = '127.0.0.1';
const OBSIDIAN_CORS_ORIGIN = 'app://obsidian.md';

// Default values
const DEFAULT_SESSION_TITLE = 'OnyxMind Session';

// Error messages
const ERROR_CLIENT_NOT_INITIALIZED = 'OpenCode client not initialized';

// SDK message part types
const PART_TYPE_TEXT = 'text';
const PART_TYPE_REASONING = 'reasoning';
const PART_TYPE_TOOL = 'tool';

export interface Message {
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
	error?: string;
	tools?: StreamChunkToolUse[];
	hasThinking?: boolean;
}

export interface RemoteSessionSummary {
	id: string;
	title: string;
	directory: string;
	createdAt: number;
	updatedAt: number;
}

export interface AvailableCommand {
	name: string;
	description: string;
	source: 'command' | 'mcp' | 'skill';
	template: string;
}

/** Incremental text content from the assistant */
export interface StreamChunkContent {
	type: 'content';
	text: string;
}

/** Reasoning / thinking text from the model */
export interface StreamChunkThinking {
	type: 'thinking';
	text: string;
}

/** Tool invocation (may fire multiple times as state changes) */
export interface StreamChunkToolUse {
	type: 'tool_use';
	partId: string;
	tool: string;
	status: 'pending' | 'running' | 'completed' | 'error';
	input?: Record<string, unknown>;
	title?: string;    // running / completed
	output?: string;   // completed
	error?: string;    // error
}

/** A recoverable or fatal error occurred during generation */
export interface StreamChunkError {
	type: 'error';
	error: string;
}

export type StreamChunk =
	| StreamChunkContent
	| StreamChunkThinking
	| StreamChunkToolUse
	| StreamChunkError;

type SessionError =
	| ApiError
	| ProviderAuthError
	| UnknownError
	| MessageOutputLengthError
	| MessageAbortedError
	| StructuredOutputError
	| ContextOverflowError;

function extractErrorMessage(err: SessionError): string {
	if ('data' in err && err.data && typeof err.data === 'object' && 'message' in err.data) {
		return `[${err.name}] ${(err.data as { message: string }).message}`;
	}
	return err.name;
}

export class OpencodeService {
	private client: OpencodeClient | null = null;
	private settings: OnyxMindSettings;
	private app: App;
	private server: any = null;
	private abortController: AbortController | null = null;
	private vaultPath: string | null = null;

	private port = 4096;

	constructor(app: App, settings: OnyxMindSettings) {
		this.app = app;
		this.settings = settings;
	}

	/**
	 * Kill any process occupying the configured port
	 */
	private killPortProcess(): void {
		try {
			const result = execSync(`lsof -ti tcp:${this.port}`, { encoding: 'utf-8' }).trim();
			if (result) {
				const pids = result.split('\n').map(p => p.trim()).filter(Boolean);
				for (const pid of pids) {
					try {
						execSync(`kill -9 ${pid}`);
						console.log(`[OnyxMind] Killed residual process ${pid} on port ${this.port}`);
					} catch (_) { /* already dead */ }
				}
			}
		} catch (_) { /* no process on port, that's fine */ }
	}

	/**
	 * Initialize the OpenCode client and server
	 * Based on tests/sse-prompt-test.js initialization pattern
	 */
	async initialize(): Promise<boolean> {
		try {
			console.log('[OnyxMind] Initializing OpenCode with full server...');

			// Kill any residual process from a previous session
			this.killPortProcess();
			// Enhance PATH so the opencode binary can be found in GUI app environment
			process.env.PATH = getEnhancedPath();

			const execPath = findOpencodeExecutable();
			if (!execPath) {
				const msg = 'opencode binary not found. Please install opencode and ensure it is on your PATH.';
				new Notice(msg);
				console.error('[OnyxMind]', msg);
				return false;
			}
			console.log('[OnyxMind] Found opencode at:', execPath);

			this.abortController = new AbortController();

			// Build the Obsidian-aware system prompt for the build agent
			this.vaultPath = (this.app as any).vault.adapter.basePath as string | undefined ?? null;
			if (!this.vaultPath) {
				const msg = 'Failed to detect vault path.';
				new Notice(msg);
				console.error('[OnyxMind]', msg);
				return false;
			}
			const agentPrompt = buildAgentPrompt({ vaultPath: this.vaultPath });

			// 1. 启动 server（使用 patch 版本，cors 同时通过 --cors 参数传入）
			const serverResult = await createOpencodeServerPatched({
				hostname: SERVER_HOSTNAME,
				port: this.port,
				signal: this.abortController.signal,
				config: {
					model: this.settings.modelId,
					server: {
						cors: [OBSIDIAN_CORS_ORIGIN],
					},
					provider: {
						[this.settings.providerId]: {
							models: {
								[this.settings.modelId]: {
									name: this.settings.modelId,
								},
							},
							options: {
								apiKey: this.settings.apiKey,
							},
						},
					},
					agent: {
						build: {
							prompt: agentPrompt,
						},
					},
				} as any,
			});

			this.server = serverResult;

			// 2. 创建 client，连接到 server
			this.client = createOpencodeClient({
				baseUrl: serverResult.url,
				directory: this.vaultPath,
			});

			console.log('[OnyxMind] OpenCode initialized successfully');
			return true;

		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Failed to initialize OpenCode: ${message}`);
			console.error('[OnyxMind Error] OpenCode initialization error:', error);
			return false;
		}
	}

	/**
	 * Destroy the OpenCode server synchronously
	 * Safe to call from onunload() which is synchronous
	 */
	destroy(): void {
		console.log('[OnyxMind] Destroying OpenCode server...');
		if (this.abortController) {
			this.abortController.abort();
			this.abortController = null;
		}
		if (this.server) {
			try { this.server.close(); } catch (_) { /* proc already killed by abort */ }
			this.server = null;
		}
		this.client = null;
		this.vaultPath = null;
		// Fallback: force-kill anything still on the port
		this.killPortProcess();
	}

	/**
	 * Check if the service is initialized
	 */
	isInitialized(): boolean {
		return this.client !== null;
	}

	/**
	 * Get underlying OpenCode client
	 */
	getClient(): OpencodeClient {
		if (!this.client) {
			throw new Error('OpenCode client not initialized');
		}
		return this.client;
	}

	/**
	 * Get current vault path used for OpenCode directory scoping
	 */
	getVaultPath(): string | null {
		return this.vaultPath;
	}

	/**
	 * List sessions under current vault directory scope
	 */
	async listSessions(): Promise<RemoteSessionSummary[] | null> {
		if (!this.client) {
			return null;
		}

		const vaultPath = this.vaultPath ?? (this.app as any).vault.adapter.basePath;
		if (!vaultPath) {
			return null;
		}

		try {
			const response = await this.client.session.list({
				directory: vaultPath,
			});

			if (!('data' in response) || !Array.isArray(response.data)) {
				return [];
			}

			return response.data
				.filter((item: any) => item && typeof item.id === 'string')
				.map((item: any) => ({
					id: item.id,
					title: typeof item.title === 'string' ? item.title : 'Session',
					directory: typeof item.directory === 'string' ? item.directory : vaultPath,
					createdAt: typeof item.time?.created === 'number' ? item.time.created : Date.now(),
					updatedAt: typeof item.time?.updated === 'number' ? item.time.updated : Date.now(),
				}));
		} catch (error) {
			console.error('[OnyxMind] Failed to list sessions:', error);
			return null;
		}
	}

	/**
	 * List available slash commands under current vault directory scope
	 */
	async listCommands(): Promise<AvailableCommand[] | null> {
		if (!this.client) {
			return null;
		}

		const vaultPath = this.vaultPath ?? (this.app as any).vault.adapter.basePath;
		if (!vaultPath) {
			return null;
		}

		try {
			const response = await this.client.command.list({
				directory: vaultPath,
			});

			if (!('data' in response) || !Array.isArray(response.data)) {
				return [];
			}

			return response.data
				.filter((item: any) => item && typeof item.name === 'string')
				.map((item: any): AvailableCommand => ({
					name: item.name,
					description: typeof item.description === 'string' ? item.description : '',
					source: item.source === 'mcp' || item.source === 'skill' ? item.source : 'command',
					template: typeof item.template === 'string' ? item.template : '',
				}))
				.sort((a, b) => a.name.localeCompare(b.name));
		} catch (error) {
			console.error('[OnyxMind] Failed to list commands:', error);
			return null;
		}
	}

	/**
	 * Load message history for a specific session in the current vault scope
	 */
	async getSessionMessages(sessionId: string): Promise<Message[] | null> {
		if (!this.client) {
			return null;
		}

		const vaultPath = this.vaultPath ?? (this.app as any).vault.adapter.basePath;
		if (!vaultPath) {
			return null;
		}

		try {
			const response = await this.client.session.messages({
				sessionID: sessionId,
				directory: vaultPath,
				limit: Math.max(1, this.settings.maxHistoryMessages),
			});

			if (!('data' in response) || !Array.isArray(response.data)) {
				return [];
			}

			const messages = response.data
				.map((entry: any): Message | null => {
					if (!entry || typeof entry !== 'object' || !entry.info) {
						return null;
					}

					const role = entry.info.role === 'assistant' ? 'assistant' : 'user';
					const timestamp = typeof entry.info.time?.created === 'number'
						? entry.info.time.created
						: Date.now();
					const reasoning = this.extractReasoningText(entry.parts);
					const hasReasoningText = reasoning.trim().length > 0;
					const content = this.extractMessageText(entry.parts);
					const tools = role === 'assistant'
						? this.extractToolParts(entry.parts)
						: [];
					const error = role === 'assistant' && entry.info.error
						? this.formatSessionError(entry.info.error)
						: undefined;

					if (!content && !error && tools.length === 0) {
						return null;
					}

					return {
						role,
						content,
						timestamp,
						error,
						tools: tools.length > 0 ? tools : undefined,
						hasThinking: role === 'assistant' && hasReasoningText ? true : undefined,
					};
				})
				.filter((message: Message | null): message is Message => message !== null)
				.sort((a, b) => a.timestamp - b.timestamp);

			return messages;
		} catch (error) {
			console.error('[OnyxMind] Failed to load session messages:', error);
			return null;
		}
	}

	private extractMessageText(parts: unknown): string {
		if (!Array.isArray(parts)) {
			return '';
		}

		const text = parts
			.filter((part: any) => part?.type === PART_TYPE_TEXT && typeof part.text === 'string')
			.map((part: any) => part.text)
			.join('');

		if (text) {
			return text;
		}

		const reasoning = this.extractReasoningText(parts);
		return reasoning.trim().length > 0 ? reasoning : '';
	}

	private extractReasoningText(parts: unknown): string {
		if (!Array.isArray(parts)) {
			return '';
		}

		return parts
			.filter((part: any) => part?.type === PART_TYPE_REASONING && typeof part.text === 'string')
			.map((part: any) => part.text)
			.join('');
	}

	private extractToolParts(parts: unknown): StreamChunkToolUse[] {
		if (!Array.isArray(parts)) {
			return [];
		}

		const tools: StreamChunkToolUse[] = [];
		for (const part of parts) {
			if (!part || typeof part !== 'object') {
				continue;
			}

			const raw = part as any;
			if (raw.type !== PART_TYPE_TOOL || typeof raw.tool !== 'string' || typeof raw.id !== 'string') {
				continue;
			}

			const state = raw.state;
			if (!state || typeof state !== 'object') {
				continue;
			}

			const status = state.status === 'running'
				|| state.status === 'completed'
				|| state.status === 'error'
				|| state.status === 'pending'
				? state.status
				: 'pending';

			const tool: StreamChunkToolUse = {
				type: 'tool_use',
				partId: raw.id,
				tool: raw.tool,
				status,
			};

			if (state.input && typeof state.input === 'object' && !Array.isArray(state.input)) {
				tool.input = state.input as Record<string, unknown>;
			}

			if (typeof state.title === 'string') {
				tool.title = state.title;
			}

			if (state.output !== undefined && state.output !== null) {
				tool.output = this.toDisplayString(state.output);
			}

			if (state.error !== undefined && state.error !== null) {
				tool.error = this.toDisplayString(state.error);
			}

			tools.push(tool);
		}

		return tools;
	}

	private toDisplayString(value: unknown): string {
		if (typeof value === 'string') {
			return value;
		}
		try {
			return JSON.stringify(value, null, 2);
		} catch (_) {
			return String(value);
		}
	}

	private formatSessionError(error: unknown): string {
		if (error && typeof error === 'object' && 'name' in error) {
			try {
				return extractErrorMessage(error as SessionError);
			} catch (_) {
				// Fall through to generic formatting
			}
		}

		if (error instanceof Error) {
			return error.message;
		}

		return String(error);
	}

	/**
	 * Create a new session
	 */
	async createSession(title?: string): Promise<string | null> {
		if (!this.client) {
			console.error('[OnyxMind]', ERROR_CLIENT_NOT_INITIALIZED);
			new Notice(ERROR_CLIENT_NOT_INITIALIZED);
			return null;
		}

		try {
			console.log('[OnyxMind] Creating session:', title);

			// Get vault path for directory parameter
			const vaultPath = this.vaultPath ?? (this.app as any).vault.adapter.basePath;
			console.log('[OnyxMind] Using vault path:', vaultPath);

			const response = await this.client.session.create({
				title: title || DEFAULT_SESSION_TITLE,
				directory: vaultPath,
			});

			console.log('[OnyxMind] Session create response:', response);
			console.log('[OnyxMind] Response data type:', response.data);

			// Handle the response structure
			if ('data' in response && response.data) {
				// Check if data is the session object directly
				if (typeof response.data === 'object' && 'id' in response.data) {
					console.log('[OnyxMind] Session created successfully:', response.data.id);
					return response.data.id;
				}

				// Check if data is an array with session object
				const dataArray = response.data as any;
				if (Array.isArray(dataArray) && dataArray.length > 0) {
					const session = dataArray[0];
					if (typeof session === 'object' && 'id' in session) {
						console.log('[OnyxMind] Session created successfully (from array):', session.id);
						return session.id;
					}
				}
			}

			const error = 'Failed to create session: Invalid response structure';
			console.error('[OnyxMind]', error, 'Response:', response);
			new Notice(error);
			return null;
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error('[OnyxMind] Session creation error:', error);
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
		prompt: string
	): Promise<AsyncIterableIterator<StreamChunk> | null> {
		if (!this.client) {
			console.error('[OnyxMind]', ERROR_CLIENT_NOT_INITIALIZED);
			new Notice(ERROR_CLIENT_NOT_INITIALIZED);
			return null;
		}

		try {
			console.log('[OnyxMind] Sending prompt to session:', sessionId);
			console.log('[OnyxMind] Prompt:', prompt.substring(0, 100) + '...');

			// Send async prompt (non-blocking)
			await this.client.session.promptAsync({
				sessionID: sessionId,
				parts: [{ type: PART_TYPE_TEXT, text: prompt }],
				model: {
					providerID: this.settings.providerId,
					modelID: this.settings.modelId,
				},
			});

			console.log('[OnyxMind] Async prompt sent, subscribing to events...');

			// Subscribe to SSE events and stream the response
			return this.streamResponseFromEvents(sessionId);

		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error('[OnyxMind] Prompt error:', error);
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
	 *   session.error                       → StreamChunkError
	 *   message.updated (assistant w/error) → StreamChunkError
	 *   session.idle                        → end of stream
	 */
	private async *streamResponseFromEvents(sessionId: string): AsyncIterableIterator<StreamChunk> {
		try {
			const events = await this.client!.event.subscribe();

			if (!events || !events.stream) {
				yield { type: 'error', error: 'No event stream available' };
				return;
			}

			console.log('[OnyxMind] Event stream subscribed, waiting for responses...');

			let isIdle = false;
			// Track the current assistant message so we only emit parts that belong to it.
			let assistantMessageId: string | null = null;

			for await (const event of events.stream) {
				switch (event.type) {
					// ── Message lifecycle ─────────────────────────────────────────
					case 'message.updated': {
						const info = event.properties.info;
						if (info.sessionID !== sessionId) break;

						if (info.role === 'assistant') {
							assistantMessageId = info.id;

							// Only report error when the message is completed (time.completed set)
							if (info.error && (info as any).time?.completed) {
								yield {
									type: 'error',
									error: extractErrorMessage(info.error),
								};
							}
						}
						break;
					}

					// ── Streaming part updates ────────────────────────────────────
					case 'message.part.updated': {
						const part = event.properties.part;
						if (part.sessionID !== sessionId) break;
						if (assistantMessageId && part.messageID !== assistantMessageId) break;

						// delta carries the incremental text; use full text as fallback
						const delta = event.properties.delta;

					if (part.type === PART_TYPE_TEXT) {
						const text = delta ?? part.text;
						if (text) yield { type: 'content', text };
					} else if (part.type === PART_TYPE_REASONING) {
						const text = delta ?? part.text;
						if (text) yield { type: 'thinking', text };
					} else if (part.type === PART_TYPE_TOOL) {
							const state = part.state;
							if (!state) break;
							const chunk: StreamChunkToolUse = {
								type: 'tool_use',
								partId: part.id,
								tool: part.tool,
								status: state.status,
								input: state.input,
							};
							if (state.status === 'running' && state.title) chunk.title = state.title;
							if (state.status === 'completed') {
								chunk.title = state.title;
								chunk.output = state.output;
							}
							if (state.status === 'error') chunk.error = state.error;
							yield chunk;
						}
						break;
					}

					// ── Session-level error (API / auth / etc.) ───────────────────
					case 'session.error': {
						if (event.properties.sessionID && event.properties.sessionID !== sessionId) break;
						if (event.properties.error) {
							yield {
								type: 'error',
								error: extractErrorMessage(event.properties.error),
							};
						}
						break;
					}

					// ── Stream termination ────────────────────────────────────────
					case 'session.idle': {
						if (event.properties.sessionID === sessionId) {
							console.log('[OnyxMind] Session idle, streaming complete');
							isIdle = true;
						}
						break;
					}

					case 'session.status':
						console.log('[OnyxMind] Session status:', (event.properties as any).status?.type);
						break;
				}

				if (isIdle) break;
			}

			console.log('[OnyxMind] Event stream completed');

		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			console.error('[OnyxMind Error] Event stream error:', error);
			yield {
				type: 'error',
				error: message
			};
		}
	}

	/**
	 * Abort a running session
	 * Sends an interrupt signal to the OpenCode server ([Request interrupted by user])
	 */
	async abortSession(sessionId: string): Promise<boolean> {
		if (!this.client) {
			return false;
		}

		try {
			console.log('[OnyxMind] Aborting session:', sessionId);
			await this.client.session.abort({ sessionID: sessionId });
			console.log('[OnyxMind] Session aborted:', sessionId);
			return true;
		} catch (error) {
			console.error('[OnyxMind Error] Failed to abort session:', error);
			return false;
		}
	}

	/**
	 * Delete a session
	 */
	async deleteSession(sessionId: string): Promise<boolean> {
		if (!this.client) {
			return false;
		}

		try {
			await this.client.session.delete({
				sessionID: sessionId,
			});
			return true;
		} catch (error) {
			console.error('Session deletion error:', error);
			return false;
		}
	}

	/**
	 * Search for files in the vault
	 * TODO: Fix API types
	 */
	async searchFiles(query: string): Promise<string[]> {
		if (!this.client) {
			return [];
		}

		// Temporarily disabled due to API type mismatch
		console.warn('searchFiles not yet implemented');
		return [];

		/*
		try {
			const response = await this.client.find.files({
				body: {
					name: query
				} as any
			});

			if ('data' in response && Array.isArray(response.data)) {
				return response.data;
			}

			return [];
		} catch (error) {
			console.error('File search error:', error);
			return [];
		}
		*/
	}

	/**
	 * Search for text in files
	 * TODO: Fix API types
	 */
	async searchText(query: string): Promise<any[]> {
		if (!this.client) {
			return [];
		}

		// Temporarily disabled due to API type mismatch
		console.warn('searchText not yet implemented');
		return [];

		/*
		try {
			const response = await this.client.find.text({
				body: {
					query: query
				} as any
			});

			if ('data' in response && Array.isArray(response.data)) {
				return response.data;
			}

			return [];
		} catch (error) {
			console.error('Text search error:', error);
			return [];
		}
		*/
	}

	/**
	 * Update settings
	 */
	updateSettings(settings: OnyxMindSettings): void {
		this.settings = settings;
		// Reinitialize client with new settings
		this.initialize();
	}

	/**
	 * Send prompt asynchronously (non-blocking)
	 * Based on tests/sse-prompt-test.js pattern
	 */
	async sendPromptAsync(sessionId: string, prompt: string): Promise<boolean> {
		if (!this.client) {
			console.error('[OnyxMind Error] Client not initialized');
			return false;
		}

		try {
			console.log('[OnyxMind] Sending async prompt:', { sessionId, promptLength: prompt.length });

			const response = await this.client.session.promptAsync({
				sessionID: sessionId,
				parts: [{ type: PART_TYPE_TEXT, text: prompt }],
				model: {
					providerID: this.settings.providerId,
					modelID: this.settings.modelId,
				},
			});

			console.log('[OnyxMind] Async prompt sent:', response);
			return true;

		} catch (error) {
			console.error('[OnyxMind Error] Failed to send async prompt:', error);
			return false;
		}
	}

	/**
	 * Subscribe to SSE event stream
	 * Returns an async iterator of events
	 * Based on tests/sse-prompt-test.js pattern
	 */
	async subscribeToEvents(): Promise<AsyncIterable<any> | null> {
		if (!this.client) {
			console.error('[OnyxMind Error] Client not initialized');
			return null;
		}

		try {
			console.log('[OnyxMind] Subscribing to event stream');

			const events = await this.client.event.subscribe();

			if (!events || !events.stream) {
				console.error('[OnyxMind Error] No event stream available');
				return null;
			}

			console.log('[OnyxMind] Event stream subscribed');
			return events.stream;

		} catch (error) {
			console.error('[OnyxMind Error] Failed to subscribe to events:', error);
			return null;
		}
	}
}
