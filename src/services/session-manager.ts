/**
 * Session Manager
 * Manages conversation sessions and their history
 */

import { Session } from "@opencode-ai/sdk/v2";
import type { OpencodeService, Message, StreamChunk } from "./opencode-service";

export interface OnyxMindSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  summarized?: boolean;
}

export type CreateSessionError = "limit-reached" | "service-error";

export interface CreateSessionResult {
  session: OnyxMindSession | null;
  error?: CreateSessionError;
}

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Message>;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    typeof candidate.timestamp === "number"
  );
}

export class SessionManager {
  private sessions: Map<string, OnyxMindSession> = new Map();
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

    const session: OnyxMindSession = {
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
  getSession(id: string): OnyxMindSession | undefined {
    return this.sessions.get(id);
  }

  /**
   * Get the active session
   */
  getActiveSession(): OnyxMindSession | null {
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
      const next = this.getMostRecentSession();
      this.activeSessionId = next ? next.id : null;
    }

    return true;
  }

  /**
   * Get all sessions sorted by creation time (oldest first, newest last).
   * This ensures newly created sessions always receive the highest index number.
   */
  getAllSessions(): OnyxMindSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => a.createdAt - b.createdAt,
    );
  }

  /**
   * Return the most recently updated session, used as a fallback when the
   * active session is removed.
   */
  private getMostRecentSession(): OnyxMindSession | null {
    let best: OnyxMindSession | null = null;
    for (const session of this.sessions.values()) {
      if (!best || session.updatedAt > best.updatedAt) {
        best = session;
      }
    }
    return best;
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
   * Mark session as summarized
   */
  markSessionSummarized(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.summarized = true;
    }
  }

  /**
   * Check if session has been summarized
   */
  isSessionSummarized(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session?.summarized ?? false;
  }

  /**
   * Summarize active session and update its title
   */
  async summarizeActiveSession(): Promise<boolean> {
    const session = this.getActiveSession();
    if (!session) {
      return false;
    }

    if (session.summarized) {
      return true;
    }

    const title = await this.opencodeService.summarizeSession(session.id);
    if (!title) {
      return false;
    }

    // Update session metadata on server
    const updateSuccess = await this.opencodeService.updateSession(session.id, {
      title,
    });
    if (!updateSuccess) {
      console.warn(
        "[OnyxMind] Failed to update session metadata on server, but continuing with local update",
      );
    }

    this.updateSessionTitle(session.id, title);
    this.markSessionSummarized(session.id);
    return true;
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
      const parsed: unknown = JSON.parse(json);
      if (!parsed || typeof parsed !== "object") {
        return;
      }

      const data = parsed as {
        sessions?: unknown;
        activeSessionId?: unknown;
      };

      const sessions = new Map<string, OnyxMindSession>();
      if (Array.isArray(data.sessions)) {
        for (const entry of data.sessions) {
          if (!Array.isArray(entry) || entry.length < 2) {
            continue;
          }

          const tuple = entry as unknown[];
          const id = tuple[0];
          const rawSession = tuple[1];
          if (
            typeof id !== "string" ||
            !rawSession ||
            typeof rawSession !== "object"
          ) {
            continue;
          }

          const session = rawSession as Partial<OnyxMindSession>;
          if (typeof session.title !== "string") {
            continue;
          }

          sessions.set(id, {
            id,
            title: session.title,
            messages: Array.isArray(session.messages)
              ? session.messages.filter((message) => isMessage(message))
              : [],
            createdAt:
              typeof session.createdAt === "number"
                ? session.createdAt
                : Date.now(),
            updatedAt:
              typeof session.updatedAt === "number"
                ? session.updatedAt
                : Date.now(),
          });
        }
      }

      this.sessions = sessions;
      this.activeSessionId =
        typeof data.activeSessionId === "string" &&
        this.sessions.has(data.activeSessionId)
          ? data.activeSessionId
          : null;
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
    const remoteSessions: Session[] | null =
      await this.opencodeService.listSessions();
    if (!remoteSessions) {
      return false;
    }

    const previousSessions = this.sessions;
    const next = new Map<string, OnyxMindSession>();
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
      const nextActive = this.getMostRecentSession();
      this.activeSessionId = nextActive ? nextActive.id : null;
    }
    return true;
  }

  private mergeRemoteSession(
    remote: Session,
    existing?: OnyxMindSession,
  ): OnyxMindSession {
    return {
      id: remote.id,
      title: remote.title || existing?.title || "Session",
      messages: existing?.messages ?? [],
      createdAt: existing?.createdAt ?? remote.time.created,
      updatedAt: Math.max(existing?.updatedAt ?? 0, remote.time.updated),
    };
  }

  /**
   * Send a prompt to a session and return a streaming response iterator
   */
  async sendPrompt(
    sessionId: string,
    prompt: string,
  ): Promise<AsyncIterableIterator<StreamChunk> | null> {
    return this.opencodeService.sendPrompt(sessionId, prompt);
  }

  /**
   * Abort a running session request
   */
  async abortSession(sessionId: string): Promise<boolean> {
    return this.opencodeService.abortSession(sessionId);
  }

  /**
   * Reply to a question asked during streaming
   */
  async replyToQuestion(
    questionId: string,
    answers: string[][],
  ): Promise<boolean> {
    return this.opencodeService.replyToQuestion(questionId, answers);
  }
}
