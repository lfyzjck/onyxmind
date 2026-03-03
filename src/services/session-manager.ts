/**
 * Session Manager
 * Manages conversation sessions and their history
 */

import type {
  OpencodeService,
  Message,
  RemoteSessionSummary,
} from "./opencode-service";

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export type CreateSessionError = "limit-reached" | "service-error";

export interface CreateSessionResult {
  session: Session | null;
  error?: CreateSessionError;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private activeSessionId: string | null = null;
  private opencodeService: OpencodeService;
  private getMaxActiveSessions: () => number;

  constructor(
    opencodeService: OpencodeService,
    getMaxActiveSessions: () => number,
  ) {
    this.opencodeService = opencodeService;
    this.getMaxActiveSessions = getMaxActiveSessions;
  }

  /**
   * Create a new session
   */
  async createSession(title?: string): Promise<CreateSessionResult> {
    if (this.isAtSessionLimit()) {
      return { session: null, error: "limit-reached" };
    }

    const sessionId = await this.opencodeService.createSession(title);

    if (!sessionId) {
      return { session: null, error: "service-error" };
    }

    const session: Session = {
      id: sessionId,
      title: title || `Session ${this.sessions.size + 1}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(sessionId, session);
    this.setActiveSession(sessionId);

    return { session };
  }

  /**
   * Check whether session creation is blocked by the configured limit
   */
  isAtSessionLimit(): boolean {
    return this.sessions.size >= this.getSessionLimit();
  }

  /**
   * Current configured max active session count
   */
  getSessionLimit(): number {
    const raw = this.getMaxActiveSessions();
    if (!Number.isFinite(raw)) {
      return 3;
    }
    return Math.max(1, Math.floor(raw));
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
   * Get active session ID
   */
  getActiveSessionId(): string | null {
    return this.activeSessionId;
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
   * Activate a session and hydrate its message history from OpenCode
   */
  async activateSession(id: string): Promise<boolean> {
    if (!this.setActiveSession(id)) {
      return false;
    }
    await this.refreshActiveSessionMessages();
    return true;
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

    // If this was the active session, switch to the most recently updated remaining session
    if (this.activeSessionId === id) {
      const next = this.getAllSessions()[0];
      this.activeSessionId = next ? next.id : null;
    }

    return true;
  }

  /**
   * Get all sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
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
      activeSessionId: this.activeSessionId,
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
      console.error("Failed to load sessions:", error);
    }
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Refresh message history for the currently active session
   */
  async refreshActiveSessionMessages(): Promise<boolean> {
    if (!this.activeSessionId) {
      return false;
    }
    return this.refreshSessionMessages(this.activeSessionId);
  }

  /**
   * Refresh message history for a specific session
   */
  async refreshSessionMessages(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    const messages = await this.opencodeService.getSessionMessages(sessionId);
    if (!messages) {
      return false;
    }

    session.messages = messages;
    const latestTimestamp =
      messages.length > 0
        ? messages[messages.length - 1]!.timestamp
        : session.updatedAt;
    session.updatedAt = Math.max(session.updatedAt, latestTimestamp);
    return true;
  }

  /**
   * Refresh local session index from OpenCode session.list filtered by current vault directory
   */
  async refreshSessionsFromService(): Promise<boolean> {
    const remoteSessions = await this.opencodeService.listSessions();
    if (!remoteSessions) {
      return false;
    }

    const previousSessions = this.sessions;
    const next = new Map<string, Session>();
    for (const remote of remoteSessions) {
      const existing = this.sessions.get(remote.id);
      next.set(remote.id, this.mergeRemoteSession(remote, existing));
    }

    // Keep the current active local session if remote list is temporarily stale.
    if (this.activeSessionId && !next.has(this.activeSessionId)) {
      const activeLocal = previousSessions.get(this.activeSessionId);
      if (activeLocal) {
        next.set(this.activeSessionId, activeLocal);
      }
    }

    this.sessions = next;
    if (!this.activeSessionId || !this.sessions.has(this.activeSessionId)) {
      const nextActive = this.getAllSessions()[0];
      this.activeSessionId = nextActive ? nextActive.id : null;
    }
    return true;
  }

  private mergeRemoteSession(
    remote: RemoteSessionSummary,
    existing?: Session,
  ): Session {
    return {
      id: remote.id,
      title: remote.title || existing?.title || "Session",
      messages: existing?.messages ?? [],
      createdAt: existing?.createdAt ?? remote.createdAt,
      updatedAt: Math.max(existing?.updatedAt ?? 0, remote.updatedAt),
    };
  }
}
