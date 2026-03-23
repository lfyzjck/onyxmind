/**
 * Stream chunk type definitions for OpenCode streaming responses.
 */

export type PermissionReply = "once" | "always" | "reject";

/** Incremental text content from the assistant */
export interface StreamChunkContent {
  type: "content";
  text: string;
}

/** Reasoning / thinking text from the model */
export interface StreamChunkThinking {
  type: "thinking";
  text: string;
}

/** Tool invocation (may fire multiple times as state changes) */
export interface StreamChunkToolUse {
  type: "tool_use";
  partId: string;
  tool: string;
  status: "pending" | "running" | "completed" | "error";
  input?: Record<string, unknown>;
  title?: string; // running / completed
  output?: string; // completed
  error?: string; // error
  // Question tool fields (present when tool === "question")
  questionId?: string;
  // Permission tool fields (present when tool === "permission")
  permissionId?: string;
  permissionType?: string;
  permissionPatterns?: string[];
  permissionMetadata?: Record<string, unknown>;
}

export interface QuestionOption {
  label: string;
}

export interface QuestionInfo {
  question: string;
  header?: string;
  options: QuestionOption[];
  multiSelect?: boolean;
}

/** Interactive question asked by the assistant (not a tool_use) */
export interface StreamChunkQuestion {
  type: "question";
  questionId: string;
  questions: QuestionInfo[];
}

/** Permission request from the assistant (not a tool_use) */
export interface StreamChunkPermission {
  type: "permission";
  permissionId: string;
  permissionType: string;
  permissionPatterns: string[];
  permissionMetadata: Record<string, unknown>;
}

/** A recoverable or fatal error occurred during generation */
export interface StreamChunkError {
  type: "error";
  error: string;
}

export type StreamChunk =
  | StreamChunkContent
  | StreamChunkThinking
  | StreamChunkToolUse
  | StreamChunkQuestion
  | StreamChunkPermission
  | StreamChunkError;

export interface AvailableCommand {
  name: string;
  description: string;
  source: "command" | "mcp" | "skill";
  template: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  error?: string;
  tools?: StreamChunkToolUse[];
  hasThinking?: boolean;
  displayContent?: string;
}
