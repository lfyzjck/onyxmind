/**
 * Session Manager
 * Manages conversation sessions and their history
 */

import type { OpencodeService, Message } from './opencode-service';

export interface Session {
	id: string;
	title: string;
	messages: Message[];
	createdAt: number;
	updatedAt: number;
}

/**
 * Callbacks for real-time message events
 */
export interface MessageEventCallbacks {
	onMessageStart?: (messageId: string) => void;
	onTextDelta?: (text: string) => void;
	onThinking?: (thinking: string) => void;
	onMessageComplete?: (message: Message) => void;
	onError?: (error: any) => void;
	onStatusChange?: (status: 'busy' | 'idle') => void;
}

export class SessionManager {
	private sessions: Map<string, Session> = new Map();
	private activeSessionId: string | null = null;
	private opencodeService: OpencodeService;

	constructor(opencodeService: OpencodeService) {
		this.opencodeService = opencodeService;
	}

	/**
	 * Create a new session
	 */
	async createSession(title?: string): Promise<Session | null> {
		const sessionId = await this.opencodeService.createSession(title);

		if (!sessionId) {
			return null;
		}

		const session: Session = {
			id: sessionId,
			title: title || `Session ${this.sessions.size + 1}`,
			messages: [],
			createdAt: Date.now(),
			updatedAt: Date.now()
		};

		this.sessions.set(sessionId, session);
		this.activeSessionId = sessionId;

		return session;
	}

	/**
	 * Get a session by ID
	 */
	getSession(id: string): Session | undefined {
		return this.sessions.get(id);
	}

	/**
	 * Get the active session
	 */
	getActiveSession(): Session | null {
		if (!this.activeSessionId) {
			return null;
		}
		return this.sessions.get(this.activeSessionId) || null;
	}

	/**
	 * Set the active session
	 */
	setActiveSession(id: string): boolean {
		if (this.sessions.has(id)) {
			this.activeSessionId = id;
			return true;
		}
		return false;
	}

	/**
	 * Delete a session
	 */
	async deleteSession(id: string): Promise<boolean> {
		const session = this.sessions.get(id);
		if (!session) {
			return false;
		}

		// Delete from OpenCode
		await this.opencodeService.deleteSession(id);

		// Remove from local storage
		this.sessions.delete(id);

		// If this was the active session, clear it
		if (this.activeSessionId === id) {
			this.activeSessionId = null;
		}

		return true;
	}

	/**
	 * Get all sessions
	 */
	getAllSessions(): Session[] {
		return Array.from(this.sessions.values())
			.sort((a, b) => b.updatedAt - a.updatedAt);
	}

	/**
	 * Add a message to a session
	 */
	addMessage(sessionId: string, message: Message): void {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.messages.push(message);
			session.updatedAt = Date.now();
		}
	}

	/**
	 * Update session title
	 */
	updateSessionTitle(sessionId: string, title: string): void {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.title = title;
			session.updatedAt = Date.now();
		}
	}

	/**
	 * Clear all messages in a session
	 */
	clearSessionMessages(sessionId: string): void {
		const session = this.sessions.get(sessionId);
		if (session) {
			session.messages = [];
			session.updatedAt = Date.now();
		}
	}

	/**
	 * Serialize sessions to JSON for persistence
	 */
	toJSON(): string {
		const data = {
			sessions: Array.from(this.sessions.entries()),
			activeSessionId: this.activeSessionId
		};
		return JSON.stringify(data);
	}

	/**
	 * Load sessions from JSON
	 */
	fromJSON(json: string): void {
		try {
			const data = JSON.parse(json);
			this.sessions = new Map(data.sessions);
			this.activeSessionId = data.activeSessionId;
		} catch (error) {
			console.error('Failed to load sessions:', error);
		}
	}

	/**
	 * Get session count
	 */
	getSessionCount(): number {
		return this.sessions.size;
	}

	/**
	 * Send a message and subscribe to real-time events
	 * Based on SSE event stream pattern from tests/sse-prompt-test.js
	 */
	async sendMessageWithEvents(
		sessionId: string,
		prompt: string,
		callbacks?: MessageEventCallbacks
	): Promise<Message | null> {
		const session = this.sessions.get(sessionId);
		if (!session) {
			console.error('[OnyxMind] Session not found:', sessionId);
			return null;
		}

		try {
			// Add user message to session
			const userMessage: Message = {
				role: 'user',
				content: prompt,
				timestamp: Date.now()
			};
			this.addMessage(sessionId, userMessage);

			// Send async prompt
			await this.opencodeService.sendPromptAsync(sessionId, prompt);

			// Subscribe to SSE events and collect response
			const assistantMessage = await this.collectResponseFromEvents(sessionId, callbacks);

			if (assistantMessage) {
				this.addMessage(sessionId, assistantMessage);
				return assistantMessage;
			}

			return null;

		} catch (error) {
			console.error('[OnyxMind Error] Failed to send message:', error);
			callbacks?.onError?.(error);
			return null;
		}
	}

	/**
	 * Collect response from SSE event stream
	 * Pattern based on tests/sse-prompt-test.js
	 */
	private async collectResponseFromEvents(
		sessionId: string,
		callbacks?: MessageEventCallbacks
	): Promise<Message | null> {
		const events = await this.opencodeService.subscribeToEvents();
		if (!events) {
			return null;
		}

		let messageId: string | null = null;
		let fullText = '';
		const parts: any[] = [];
		let error: any = null;
		let isIdle = false;

		try {
			for await (const event of events) {
				switch (event.type) {
					case 'message.updated':
						if (event.properties?.info?.role === 'assistant') {
							messageId = event.properties.info.id;
							if (messageId) callbacks?.onMessageStart?.(messageId);

							if (event.properties.info.error) {
								error = event.properties.info.error;
								callbacks?.onError?.(error);
							}
						}
						break;

					case 'message.part.updated':
						if (event.properties?.part) {
							const part = event.properties.part;
							parts.push(part);

							if (part.type === 'text' && part.text) {
								fullText += part.text;
								callbacks?.onTextDelta?.(part.text);
							} else if (part.type === 'thinking' && part.thinking) {
								callbacks?.onThinking?.(part.thinking);
							}
						}
						break;

					case 'session.status':
						if (event.properties?.status) {
							const status = event.properties.status.type;
							callbacks?.onStatusChange?.(status);
						}
						break;

					case 'session.idle':
						isIdle = true;
						callbacks?.onStatusChange?.('idle');
						break;
				}

				// Exit when session becomes idle
				if (isIdle) {
					// Wait a bit to ensure all events are received
					await new Promise(resolve => setTimeout(resolve, 500));
					break;
				}
			}

			// Create assistant message
			if (fullText || error) {
				const assistantMessage: Message = {
					role: 'assistant',
					content: fullText,
					timestamp: Date.now(),
					error: error
				};

				callbacks?.onMessageComplete?.(assistantMessage);
				return assistantMessage;
			}

			return null;

		} catch (error) {
			console.error('[OnyxMind Error] Event stream error:', error);
			callbacks?.onError?.(error);
			return null;
		}
	}
}
