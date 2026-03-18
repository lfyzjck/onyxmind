import { test, expect } from "vitest";
import { ChatService } from "../../src/services/chat-service";
import { SessionManager } from "../../src/services/session-manager";

async function* createStream(chunks: object[]) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

function createOpencodeService() {
  return {
    nextRemoteId: 1,
    createdSessions: [] as { id: string; title: string }[],
    sentPrompts: [] as { sessionId: string; prompt: string }[],
    async createSession(title: string) {
      const id = `remote-${this.nextRemoteId++}`;
      this.createdSessions.push({ id, title });
      return id;
    },
    async sendPrompt(sessionId: string, prompt: string) {
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
        {
          type: "tool_use",
          partId: "tool_RfA5gb2yXtJbtfImHq7V5ELk",
          tool: "permission",
          status: "running",
          permissionId: "per_cfb1997b9001lAa9fxmJ1XtBgl",
          permissionType: "edit",
          permissionPatterns: ["default/测试笔记.md"],
          permissionMetadata: {
            filepath: "default/测试笔记.md",
            diff: [
              "Index: default/测试笔记.md",
              "===================================================================",
              "--- default/测试笔记.md",
              "+++ default/测试笔记.md",
              "@@ -0,0 +1,3 @@",
              "+---",
              "+title: 测试笔记",
              "+date: 2026-03-17",
            ].join("\n"),
          },
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
  const sessionManager = new SessionManager(opencodeService as never, () => 3);
  const chatService = new ChatService(sessionManager);

  const createResult = await chatService.ensureActiveSession();
  const localSession = createResult.session;

  expect(localSession).toBeTruthy();
  expect(localSession.id).toMatch(/^local-/);

  const userMessage = chatService.addUserMessage(
    localSession.id,
    "Please inspect the vault",
    "Please inspect the vault",
  );

  expect(userMessage).toBeTruthy();
  expect(sessionManager.getActiveSession()?.messages.length).toBe(1);

  const assistantMessage = await chatService.streamAssistantResponse(
    localSession,
    "Please inspect the vault",
  );

  expect(assistantMessage).toBeTruthy();
  expect(opencodeService.createdSessions.length).toBe(1);
  expect(opencodeService.sentPrompts).toEqual([
    { sessionId: "remote-1", prompt: "Please inspect the vault" },
  ]);

  const activeSession = sessionManager.getActiveSession();
  expect(activeSession).toBeTruthy();
  expect(activeSession!.id).toBe("remote-1");
  expect(activeSession!.remoteCreated).toBe(true);
  expect(activeSession!.messages.length).toBe(2);
  expect(activeSession!.messages.map((message) => message.role)).toEqual([
    "user",
    "assistant",
  ]);
  expect(activeSession!.messages[0].displayContent).toBe(
    "Please inspect the vault",
  );
  expect(activeSession!.messages[1].content).toBe("Finished");
  expect(
    activeSession!.messages[1].tools?.map((tool) => ({
      partId: tool.partId,
      tool: tool.tool,
      status: tool.status,
    })),
  ).toEqual([
    { partId: "tool-1", tool: "question", status: "completed" },
    { partId: "tool-2", tool: "bash", status: "completed" },
    {
      partId: "tool_RfA5gb2yXtJbtfImHq7V5ELk",
      tool: "permission",
      status: "running",
    },
  ]);
  const permissionTool =
    activeSession!.messages[1].tools?.find(
      (tool) => tool.tool === "permission",
    ) ?? null;
  expect(permissionTool).toBeTruthy();
  expect(permissionTool?.permissionId).toBe(
    "per_cfb1997b9001lAa9fxmJ1XtBgl",
  );
  expect(permissionTool?.permissionPatterns).toEqual(["default/测试笔记.md"]);
  expect(permissionTool?.permissionMetadata?.filepath).toBe(
    "default/测试笔记.md",
  );
});
