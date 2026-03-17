import test from "node:test";
import assert from "node:assert/strict";
import { loadTsModule } from "../helpers/load-ts.js";

const { SessionManager } = loadTsModule("src/services/session-manager.ts");

async function* createStream(chunks) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

function createService() {
  let nextSessionId = 1;
  return {
    createdSessions: [],
    sentPrompts: [],
    async createSession(title) {
      const id = `remote-${nextSessionId++}`;
      this.createdSessions.push({ id, title });
      return id;
    },
    async sendPrompt(sessionId, prompt) {
      this.sentPrompts.push({ sessionId, prompt });
      return createStream([{ type: "content", text: "Ack" }]);
    },
    async abortSession(sessionId) {
      this.abortedSessionId = sessionId;
      return true;
    },
    async replyToQuestion(questionId, answers) {
      this.questionReply = { questionId, answers };
      return true;
    },
    async replyToPermission(requestId, reply) {
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
  const manager = new SessionManager(createService(), () => 2);

  const first = manager.createSession("First").session;
  const second = manager.createSession("Second").session;
  const third = manager.createSession("Third").session;

  assert.ok(first);
  assert.ok(second);
  assert.ok(third);
  assert.equal(manager.getSessionCount(), 2);
  assert.equal(manager.getSession(first.id), undefined);
  assert.equal(manager.getAllSessions().map((session) => session.title).join(","), "Second,Third");
  assert.equal(manager.getActiveSessionId(), third.id);
});

test("sendPrompt lazily creates the remote session and migrates the active session id", async () => {
  const service = createService();
  const manager = new SessionManager(service, () => 3);
  const localSession = manager.createSession("Draft").session;

  assert.ok(localSession);
  assert.equal(localSession.remoteCreated, false);
  const localSessionId = localSession.id;

  const stream = await manager.sendPrompt(localSessionId, "Hello");

  assert.ok(stream);
  assert.equal(service.createdSessions.length, 1);
  assert.deepEqual(service.sentPrompts, [
    { sessionId: "remote-1", prompt: "Hello" },
  ]);
  assert.equal(manager.getActiveSessionId(), "remote-1");
  assert.equal(manager.getSession(localSessionId), undefined);
  assert.equal(manager.getSession("remote-1")?.remoteCreated, true);
});

test("fromJSON filters invalid messages and drops an invalid active session id", () => {
  const manager = new SessionManager(createService(), () => 3);

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
  assert.ok(session);
  assert.deepEqual(session.messages, [
    { role: "assistant", content: "Keep me", timestamp: 1 },
  ]);
  assert.equal(session.remoteCreated, false);
  assert.equal(manager.getActiveSessionId(), null);
});
