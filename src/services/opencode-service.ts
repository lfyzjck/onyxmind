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

export interface Message {
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
	error?: any;
}

export interface StreamChunk {
	type: 'content' | 'thinking' | 'tool_use' | 'error';
	text?: string;
	tool?: string;
	input?: unknown;
	error?: string;
}

export class OpencodeService {
	private client: any = null;
	private settings: OnyxMindSettings;
	private app: App;
	private server: any = null;
	private abortController: AbortController | null = null;

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

			// 1. 启动 server（使用 patch 版本，cors 同时通过 --cors 参数传入）
			const serverResult = await createOpencodeServerPatched({
				hostname: "127.0.0.1",
				port: this.port,
				signal: this.abortController.signal,
				config: {
					model: "k2p5",
					server: {
						cors: ["app://obsidian.md"],
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
				},
			});

			this.server = serverResult;

			// 2. 创建 client，连接到 server
			this.client = createOpencodeClient({
				baseUrl: serverResult.url,
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
	 * Create a new session
	 */
	async createSession(title?: string): Promise<string | null> {
		if (!this.client) {
			const error = 'OpenCode client not initialized';
			console.error('[OnyxMind]', error);
			new Notice(error);
			return null;
		}

		try {
			console.log('[OnyxMind] Creating session:', title);

			// Get vault path for directory parameter
			const vaultPath = (this.app as any).vault.adapter.basePath;
			console.log('[OnyxMind] Using vault path:', vaultPath);

			const response = await this.client.session.create({
				body: {
					title: title || 'OnyxMind Session'
				},
				query: {
					directory: vaultPath  // Use absolute vault path
				}
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
			const error = 'OpenCode client not initialized';
			console.error('[OnyxMind]', error);
			new Notice(error);
			return null;
		}

		try {
			console.log('[OnyxMind] Sending prompt to session:', sessionId);
			console.log('[OnyxMind] Prompt:', prompt.substring(0, 100) + '...');

			// Send async prompt (non-blocking)
			await this.client.session.promptAsync({
				path: { id: sessionId },
				body: {
					parts: [{ type: 'text', text: prompt }],
					model: {
						providerID: this.settings.providerId,
						modelID: this.settings.modelId
					}
				}
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
	 * Stream response from SSE events
	 * Converts SSE events to StreamChunk format
	 */
	private async *streamResponseFromEvents(sessionId: string): AsyncIterableIterator<StreamChunk> {
		try {
			const events = await this.client!.event.subscribe();

			if (!events || !events.stream) {
				console.error('[OnyxMind Error] No event stream available');
				yield {
					type: 'error',
					error: 'No event stream available'
				};
				return;
			}

			console.log('[OnyxMind] Event stream subscribed, waiting for responses...');

			let isIdle = false;
			let assistantMessageId: string | null = null;

			for await (const event of events.stream) {
				// Only process events for our session
				if (event.properties?.sessionID && event.properties.sessionID !== sessionId) {
					continue;
				}

				switch (event.type) {
					case 'message.updated':
						// Track assistant message creation
						if (event.properties?.info?.role === 'assistant') {
							assistantMessageId = event.properties.info.id;
							console.log('[OnyxMind] Assistant message created:', assistantMessageId);

							// Check for errors
							if (event.properties.info.error) {
								yield {
									type: 'error',
									error: JSON.stringify(event.properties.info.error)
								};
							}
						}
						break;

					case 'message.part.updated':
						// Stream text content
						if (event.properties?.part) {
							const part = event.properties.part;

							// Only process parts from our assistant message
							if (assistantMessageId && part.messageID === assistantMessageId) {
								if (part.type === 'text' && part.text) {
									yield {
										type: 'content',
										text: part.text
									};
								} else if (part.type === 'thinking' && part.thinking) {
									yield {
										type: 'thinking',
										text: part.thinking
									};
								} else if (part.type === 'tool-use' && part.tool) {
									yield {
										type: 'tool_use',
										tool: part.tool,
										input: part.input
									};
								}
							}
						}
						break;

					case 'message.part.delta':
						// Stream incremental text updates
						if (event.properties?.delta && event.properties?.partID) {
							// Only process deltas from our assistant message
							if (assistantMessageId && event.properties.messageID === assistantMessageId) {
								if (event.properties.field === 'text') {
									yield {
										type: 'content',
										text: event.properties.delta
									};
								}
							}
						}
						break;

					case 'session.idle':
						// Session completed
						if (event.properties?.sessionID === sessionId) {
							console.log('[OnyxMind] Session idle, streaming complete');
							isIdle = true;
						}
						break;

					case 'session.status':
						// Log status changes
						if (event.properties?.status) {
							console.log('[OnyxMind] Session status:', event.properties.status.type);
						}
						break;
				}

				// Exit when session becomes idle
				if (isIdle) {
					break;
				}
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
	 * Delete a session
	 */
	async deleteSession(sessionId: string): Promise<boolean> {
		if (!this.client) {
			return false;
		}

		try {
			await this.client.session.delete({
				path: { id: sessionId }
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
				path: { id: sessionId },
				body: {
					parts: [{ type: 'text', text: prompt }],
					model: {
						providerID: this.settings.providerId,
						modelID: this.settings.modelId
					}
				}
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
