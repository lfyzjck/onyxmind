import test from "node:test";
import assert from "node:assert/strict";
import { loadTsModule } from "../helpers/load-ts.js";

const { ChatService } = loadTsModule("src/services/chat-service.ts");

async function* createStream(chunks) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

test("streamAssistantResponse aggregates content and merges tool updates before persisting", async () => {
  const addedMessages = [];
  const sentPrompts = [];
  const sessionManager = {
    async sendPrompt(sessionId, prompt) {
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
    addMessage(sessionId, message) {
      addedMessages.push({ sessionId, message });
    },
  };

  const service = new ChatService(sessionManager);
  const seen = {
    content: [],
    thinking: [],
    tools: [],
  };

  const message = await service.streamAssistantResponse(
    { id: "session-1" },
    "hi",
    {
      onContentDelta: async (text) => {
        seen.content.push(text);
      },
      onThinkingDelta: (text) => {
        seen.thinking.push(text);
      },
      onToolUse: (chunk) => {
        seen.tools.push(chunk);
      },
    },
  );

  assert.deepEqual(sentPrompts, [{ sessionId: "session-1", prompt: "hi" }]);
  assert.deepEqual(seen.content, ["Hello", " world"]);
  assert.deepEqual(seen.thinking, ["Reasoning"]);
  assert.equal(seen.tools.length, 2);
  assert.equal(message?.content, "Hello world");
  assert.deepEqual(message?.tools, [
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
  assert.equal(addedMessages.length, 1);
  assert.equal(addedMessages[0].message.role, "assistant");
});

test("streamAssistantResponse surfaces chunk errors but still persists the final assistant text", async () => {
  const errors = [];
  const addedMessages = [];
  const service = new ChatService({
    async sendPrompt() {
      return createStream([
        { type: "error", error: "Transient tool error" },
        { type: "content", text: "Recovered" },
      ]);
    },
    addMessage(_sessionId, message) {
      addedMessages.push(message);
    },
  });

  const message = await service.streamAssistantResponse(
    { id: "session-2" },
    "prompt",
    {
      onError: (error) => {
        errors.push(error);
      },
    },
  );

  assert.deepEqual(errors, ["Transient tool error"]);
  assert.equal(message?.content, "Recovered");
  assert.equal(addedMessages.length, 1);
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
  });

  const message = await service.streamAssistantResponse(
    { id: "session-3" },
    "prompt",
    {
      onContentDelta: async () => {
        controller.abort();
      },
    },
    { signal: controller.signal },
  );

  assert.equal(message, null);
  assert.equal(added, false);
});
