import { test, expect } from "vitest";
import {
  getActivePermission,
  getActiveQuestion,
  getToolChunks,
  hasActiveQuestion,
  mergeToolChunkMap,
  messageHasThinkingLabel,
  shouldShowHistoricalToolCalls,
} from "../../src/views/chat/render-state";

test("mergeToolChunkMap merges partial updates without losing first-seen order", () => {
  const first = {
    type: "tool_use" as const,
    partId: "tool-1",
    tool: "question",
    status: "running" as const,
    input: {
      questions: [{ question: "Pick one", options: [{ label: "A" }] }],
    },
  };
  const second = {
    type: "tool_use" as const,
    partId: "tool-2",
    tool: "bash",
    status: "completed" as const,
    title: "echo hi",
    output: "hi",
  };
  const questionReply = {
    type: "tool_use" as const,
    partId: "tool-1",
    tool: "question",
    status: "running" as const,
    questionId: "que-1",
  };

  const merged = mergeToolChunkMap(
    mergeToolChunkMap(mergeToolChunkMap({}, first), second),
    questionReply,
  );

  expect(getToolChunks(merged).map((tool) => tool.partId)).toEqual([
    "tool-1",
    "tool-2",
  ]);
  expect(merged["tool-1"].questionId).toBe("que-1");
  expect(merged["tool-1"].input).toEqual(first.input);
  expect(merged["tool-2"].output).toBe("hi");
});

test("getActiveQuestion only returns a running question with a questionId", () => {
  const tools = [
    {
      type: "tool_use" as const,
      partId: "tool-1",
      tool: "question",
      status: "running" as const,
    },
    {
      type: "tool_use" as const,
      partId: "tool-2",
      tool: "question",
      status: "running" as const,
      questionId: "que-2",
    },
  ];

  expect(hasActiveQuestion(tools)).toBe(true);
  expect(getActiveQuestion(tools)?.partId).toBe("tool-2");
});

test("getActivePermission only returns a running permission with a permissionId", () => {
  const tools = [
    {
      type: "tool_use" as const,
      partId: "tool-1",
      tool: "permission",
      status: "completed" as const,
      permissionId: "per-old",
    },
    {
      type: "tool_use" as const,
      partId: "tool-2",
      tool: "permission",
      status: "running" as const,
      permissionId: "per-2",
    },
  ];

  expect(getActivePermission(tools)?.partId).toBe("tool-2");
});

test("shouldShowHistoricalToolCalls only enables tool cards for persisted assistant messages", () => {
  const assistantMessage = {
    role: "assistant" as const,
    content: "Done",
    timestamp: 1,
    tools: [{ partId: "tool-1" }],
  };
  const userMessage = {
    role: "user" as const,
    content: "Run it",
    timestamp: 2,
    tools: [{ partId: "tool-2" }],
  };

  expect(shouldShowHistoricalToolCalls(assistantMessage, true)).toBe(true);
  expect(shouldShowHistoricalToolCalls(assistantMessage, false)).toBe(false);
  expect(shouldShowHistoricalToolCalls(userMessage, true)).toBe(false);
});

test("messageHasThinkingLabel only enables the thought marker for assistant messages with content", () => {
  expect(
    messageHasThinkingLabel({
      role: "assistant",
      content: "Answer",
      timestamp: 1,
      hasThinking: true,
    }),
  ).toBe(true);
  expect(
    messageHasThinkingLabel({
      role: "assistant",
      content: "",
      timestamp: 1,
      hasThinking: true,
    }),
  ).toBe(false);
  expect(
    messageHasThinkingLabel({
      role: "user",
      content: "Question",
      timestamp: 1,
      hasThinking: true,
    }),
  ).toBe(false);
});
