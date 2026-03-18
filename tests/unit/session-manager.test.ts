import { test, expect } from "vitest";
import { SessionManager } from "../../src/services/session-manager";

async function* createStream(chunks: object[]) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

function createService() {
  let nextSessionId = 1;
  return {
    createdSessions: [] as { id: string; title: string }[],
    sentPrompts: [] as { sessionId: string; prompt: string }[],
    abortedSessionId: undefined as string | undefined,
    questionReply: undefined as object | undefined,
    permissionReply: undefined as object | undefined,
    async createSession(title: string) {
      const id = `remote-${nextSessionId++}`;
      this.createdSessions.push({ id, title });
      return id;
    },
    async sendPrompt(sessionId: string, prompt: string) {
      this.sentPrompts.push({ sessionId, prompt });
      return createStream([{ type: "content", text: "Ack" }]);
    },
    async abortSession(sessionId: string) {
      this.abortedSessionId = sessionId;
      return true;
    },
    async replyToQuestion(questionId: string, answers: string[]) {
      this.questionReply = { questionId, answers };
      return true;
    },
    async replyToPermission(requestId: string, reply: string) {
      this.permissionReply = { requestId, reply };
      return true;
    },
    async getSessionMessages() {
      return [];
    },
    async listSessions() {
      return [];
    },
    async deleteSession() {
      return true;
    },
    async summarizeSession() {
      return null;
    },
    async updateSession() {
      return true;
    },
  };
}

test("createSession enforces the active-session limit by evicting the oldest session", () => {
  const manager = new SessionManager(createService() as never, () => 2);

  const first = manager.createSession("First").session;
  const second = manager.createSession("Second").session;
  const third = manager.createSession("Third").session;

  expect(first).toBeTruthy();
  expect(second).toBeTruthy();
  expect(third).toBeTruthy();
  expect(manager.getSessionCount()).toBe(2);
  expect(manager.getSession(first.id)).toBeUndefined();
  expect(
    manager
      .getAllSessions()
      .map((session) => session.title)
      .join(","),
  ).toBe("Second,Third");
  expect(manager.getActiveSessionId()).toBe(third.id);
});

test("sendPrompt lazily creates the remote session and migrates the active session id", async () => {
  const service = createService();
  const manager = new SessionManager(service as never, () => 3);
  const localSession = manager.createSession("Draft").session;

  expect(localSession).toBeTruthy();
  expect(localSession.remoteCreated).toBe(false);
  const localSessionId = localSession.id;

  const stream = await manager.sendPrompt(localSessionId, "Hello");

  expect(stream).toBeTruthy();
  expect(service.createdSessions.length).toBe(1);
  expect(service.sentPrompts).toEqual([
    { sessionId: "remote-1", prompt: "Hello" },
  ]);
  expect(manager.getActiveSessionId()).toBe("remote-1");
  expect(manager.getSession(localSessionId)).toBeUndefined();
  expect(manager.getSession("remote-1")?.remoteCreated).toBe(true);
});

test("fromJSON filters invalid messages and drops an invalid active session id", () => {
  const manager = new SessionManager(createService() as never, () => 3);

  manager.fromJSON(
    JSON.stringify({
      sessions: [
        [
          "session-1",
          {
            id: "session-1",
            title: "Loaded",
            messages: [
              { role: "assistant", content: "Keep me", timestamp: 1 },
              { role: "assistant", content: 42, timestamp: 2 },
              { role: "other", content: "Ignore me", timestamp: 3 },
            ],
            createdAt: 10,
            updatedAt: 20,
            remoteCreated: false,
          },
        ],
      ],
      activeSessionId: "missing-session",
    }),
  );

  const session = manager.getSession("session-1");
  expect(session).toBeTruthy();
  expect(session!.messages).toEqual([
    { role: "assistant", content: "Keep me", timestamp: 1 },
  ]);
  expect(session!.remoteCreated).toBe(false);
  expect(manager.getActiveSessionId()).toBeNull();
});
