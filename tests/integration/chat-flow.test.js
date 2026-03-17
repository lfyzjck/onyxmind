import test from "node:test";
import assert from "node:assert/strict";
import { loadTsModule } from "../helpers/load-ts.js";

const { ChatService } = loadTsModule("src/services/chat-service.ts");
const { SessionManager } = loadTsModule("src/services/session-manager.ts");

async function* createStream(chunks) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

function createOpencodeService() {
  return {
    nextRemoteId: 1,
    createdSessions: [],
    sentPrompts: [],
    async createSession(title) {
      const id = `remote-${this.nextRemoteId++}`;
      this.createdSessions.push({ id, title });
      return id;
    },
    async sendPrompt(sessionId, prompt) {
      this.sentPrompts.push({ sessionId, prompt });
      return createStream([
        { type: "thinking", text: "Inspecting files" },
        {
          type: "tool_use",
          partId: "tool-1",
          tool: "question",
          status: "running",
          input: {
            questions: [
              {
                question: "Apply change?",
                options: [{ label: "Yes" }, { label: "No" }],
              },
            ],
          },
        },
        {
          type: "tool_use",
          partId: "tool-1",
          tool: "question",
          status: "completed",
          questionId: "que-1",
          output: "Yes",
        },
        {
          type: "tool_use",
          partId: "tool-2",
          tool: "bash",
          status: "completed",
          title: "pwd",
          output: "/vault",
        },
        { type: "content", text: "Finished" },
      ]);
    },
    async abortSession() {
      return true;
    },
    async replyToQuestion() {
      return true;
    },
    async replyToPermission() {
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

test("chat flow keeps user and assistant messages in the migrated remote session", async () => {
  const opencodeService = createOpencodeService();
  const sessionManager = new SessionManager(opencodeService, () => 3);
  const chatService = new ChatService(sessionManager);

  const createResult = await chatService.ensureActiveSession();
  const localSession = createResult.session;

  assert.ok(localSession);
  assert.match(localSession.id, /^local-/);

  const userMessage = chatService.addUserMessage(
    localSession.id,
    "Please inspect the vault",
    "Please inspect the vault",
  );

  assert.ok(userMessage);
  assert.equal(sessionManager.getActiveSession()?.messages.length, 1);

  const assistantMessage = await chatService.streamAssistantResponse(
    localSession,
    "Please inspect the vault",
  );

  assert.ok(assistantMessage);
  assert.equal(opencodeService.createdSessions.length, 1);
  assert.deepEqual(opencodeService.sentPrompts, [
    { sessionId: "remote-1", prompt: "Please inspect the vault" },
  ]);

  const activeSession = sessionManager.getActiveSession();
  assert.ok(activeSession);
  assert.equal(activeSession.id, "remote-1");
  assert.equal(activeSession.remoteCreated, true);
  assert.equal(activeSession.messages.length, 2);
  assert.deepEqual(activeSession.messages.map((message) => message.role), [
    "user",
    "assistant",
  ]);
  assert.equal(activeSession.messages[0].displayContent, "Please inspect the vault");
  assert.equal(activeSession.messages[1].content, "Finished");
  assert.deepEqual(
    activeSession.messages[1].tools?.map((tool) => ({
      partId: tool.partId,
      tool: tool.tool,
      status: tool.status,
    })),
    [
      { partId: "tool-1", tool: "question", status: "completed" },
      { partId: "tool-2", tool: "bash", status: "completed" },
    ],
  );
});
