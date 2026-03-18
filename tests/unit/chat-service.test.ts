import { test, expect } from "vitest";
import { ChatService } from "../../src/services/chat-service";

async function* createStream(chunks: object[]) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

test("streamAssistantResponse aggregates content and merges tool updates before persisting", async () => {
  const addedMessages: { sessionId: string; message: object }[] = [];
  const sentPrompts: { sessionId: string; prompt: string }[] = [];
  const sessionManager = {
    async sendPrompt(sessionId: string, prompt: string) {
      sentPrompts.push({ sessionId, prompt });
      return createStream([
        { type: "thinking", text: "Reasoning" },
        {
          type: "tool_use",
          partId: "tool-1",
          tool: "question",
          status: "running",
          input: {
            questions: [{ question: "Choose", options: [{ label: "A" }] }],
          },
        },
        {
          type: "tool_use",
          partId: "tool-1",
          tool: "question",
          status: "completed",
          questionId: "que-1",
          output: "A",
        },
        { type: "content", text: "Hello" },
        { type: "content", text: " world" },
      ]);
    },
    addMessage(sessionId: string, message: object) {
      addedMessages.push({ sessionId, message });
    },
  };

  const service = new ChatService(sessionManager as never);
  const seen = {
    content: [] as string[],
    thinking: [] as string[],
    tools: [] as object[],
  };

  const message = await service.streamAssistantResponse(
    { id: "session-1" } as never,
    "hi",
    {
      onContentDelta: async (text: string) => {
        seen.content.push(text);
      },
      onThinkingDelta: (text: string) => {
        seen.thinking.push(text);
      },
      onToolUse: (chunk: object) => {
        seen.tools.push(chunk);
      },
    },
  );

  expect(sentPrompts).toEqual([{ sessionId: "session-1", prompt: "hi" }]);
  expect(seen.content).toEqual(["Hello", " world"]);
  expect(seen.thinking).toEqual(["Reasoning"]);
  expect(seen.tools.length).toBe(2);
  expect(message?.content).toBe("Hello world");
  expect(message?.tools).toEqual([
    {
      type: "tool_use",
      partId: "tool-1",
      tool: "question",
      status: "completed",
      input: {
        questions: [{ question: "Choose", options: [{ label: "A" }] }],
      },
      questionId: "que-1",
      output: "A",
    },
  ]);
  expect(addedMessages.length).toBe(1);
  expect((addedMessages[0].message as { role: string }).role).toBe("assistant");
});

test("streamAssistantResponse surfaces chunk errors but still persists the final assistant text", async () => {
  const errors: string[] = [];
  const addedMessages: object[] = [];
  const service = new ChatService({
    async sendPrompt() {
      return createStream([
        { type: "error", error: "Transient tool error" },
        { type: "content", text: "Recovered" },
      ]);
    },
    addMessage(_sessionId: string, message: object) {
      addedMessages.push(message);
    },
  } as never);

  const message = await service.streamAssistantResponse(
    { id: "session-2" } as never,
    "prompt",
    {
      onError: (error: string) => {
        errors.push(error);
      },
    },
  );

  expect(errors).toEqual(["Transient tool error"]);
  expect(message?.content).toBe("Recovered");
  expect(addedMessages.length).toBe(1);
});

test("streamAssistantResponse returns null and does not persist when aborted before text is complete", async () => {
  const controller = new AbortController();
  let added = false;
  const service = new ChatService({
    async sendPrompt() {
      return createStream([
        { type: "content", text: "Hello" },
        { type: "content", text: " world" },
      ]);
    },
    addMessage() {
      added = true;
    },
  } as never);

  const message = await service.streamAssistantResponse(
    { id: "session-3" } as never,
    "prompt",
    {
      onContentDelta: async () => {
        controller.abort();
      },
    },
    { signal: controller.signal },
  );

  expect(message).toBeNull();
  expect(added).toBe(false);
});
