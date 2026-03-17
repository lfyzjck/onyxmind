import test from "node:test";
import assert from "node:assert/strict";
import { loadTsModule } from "../helpers/load-ts.js";

const {
  getActivePermission,
  getActiveQuestion,
  getToolChunks,
  hasActiveQuestion,
  mergeToolChunkMap,
  messageHasThinkingLabel,
  shouldShowHistoricalToolCalls,
} = loadTsModule("src/views/chat/render-state.ts");

test("mergeToolChunkMap merges partial updates without losing first-seen order", () => {
  const first = {
    type: "tool_use",
    partId: "tool-1",
    tool: "question",
    status: "running",
    input: {
      questions: [{ question: "Pick one", options: [{ label: "A" }] }],
    },
  };
  const second = {
    type: "tool_use",
    partId: "tool-2",
    tool: "bash",
    status: "completed",
    title: "echo hi",
    output: "hi",
  };
  const questionReply = {
    type: "tool_use",
    partId: "tool-1",
    tool: "question",
    status: "running",
    questionId: "que-1",
  };

  const merged = mergeToolChunkMap(
    mergeToolChunkMap(mergeToolChunkMap({}, first), second),
    questionReply,
  );

  assert.deepEqual(getToolChunks(merged).map((tool) => tool.partId), [
    "tool-1",
    "tool-2",
  ]);
  assert.equal(merged["tool-1"].questionId, "que-1");
  assert.deepEqual(merged["tool-1"].input, first.input);
  assert.equal(merged["tool-2"].output, "hi");
});

test("getActiveQuestion only returns a running question with a questionId", () => {
  const tools = [
    {
      type: "tool_use",
      partId: "tool-1",
      tool: "question",
      status: "running",
    },
    {
      type: "tool_use",
      partId: "tool-2",
      tool: "question",
      status: "running",
      questionId: "que-2",
    },
  ];

  assert.equal(hasActiveQuestion(tools), true);
  assert.equal(getActiveQuestion(tools)?.partId, "tool-2");
});

test("getActivePermission only returns a running permission with a permissionId", () => {
  const tools = [
    {
      type: "tool_use",
      partId: "tool-1",
      tool: "permission",
      status: "completed",
      permissionId: "per-old",
    },
    {
      type: "tool_use",
      partId: "tool-2",
      tool: "permission",
      status: "running",
      permissionId: "per-2",
    },
  ];

  assert.equal(getActivePermission(tools)?.partId, "tool-2");
});

test("shouldShowHistoricalToolCalls only enables tool cards for persisted assistant messages", () => {
  const assistantMessage = {
    role: "assistant",
    content: "Done",
    timestamp: 1,
    tools: [{ partId: "tool-1" }],
  };
  const userMessage = {
    role: "user",
    content: "Run it",
    timestamp: 2,
    tools: [{ partId: "tool-2" }],
  };

  assert.equal(shouldShowHistoricalToolCalls(assistantMessage, true), true);
  assert.equal(shouldShowHistoricalToolCalls(assistantMessage, false), false);
  assert.equal(shouldShowHistoricalToolCalls(userMessage, true), false);
});

test("messageHasThinkingLabel only enables the thought marker for assistant messages with content", () => {
  assert.equal(
    messageHasThinkingLabel({
      role: "assistant",
      content: "Answer",
      timestamp: 1,
      hasThinking: true,
    }),
    true,
  );
  assert.equal(
    messageHasThinkingLabel({
      role: "assistant",
      content: "",
      timestamp: 1,
      hasThinking: true,
    }),
    false,
  );
  assert.equal(
    messageHasThinkingLabel({
      role: "user",
      content: "Question",
      timestamp: 1,
      hasThinking: true,
    }),
    false,
  );
});
