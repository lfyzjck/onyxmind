import type {
  Message,
  StreamChunkToolUse,
} from "../../services/opencode-service";
import type { ToolCardMap } from "./types";

export function mergeToolChunkMap(
  previous: ToolCardMap,
  chunk: StreamChunkToolUse,
): ToolCardMap {
  const previousChunk = previous[chunk.partId];
  return {
    ...previous,
    [chunk.partId]: previousChunk ? { ...previousChunk, ...chunk } : chunk,
  };
}

export function getToolChunks(toolMap: ToolCardMap): StreamChunkToolUse[] {
  return Object.values(toolMap);
}

export function shouldShowHistoricalToolCalls(
  message: Message,
  showToolCallsAfterStreaming: boolean,
): boolean {
  return (
    message.role === "assistant" &&
    showToolCallsAfterStreaming &&
    (message.tools?.length ?? 0) > 0
  );
}

export function messageHasThinkingLabel(message: Message): boolean {
  return (
    message.role === "assistant" &&
    message.hasThinking === true &&
    message.content.length > 0
  );
}
