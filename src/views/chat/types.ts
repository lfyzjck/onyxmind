import type OnyxMindPlugin from "../../main";
import type { StreamChunkToolUse } from "../../core/stream";

export type ToolCardMap = Record<string, StreamChunkToolUse>;

export interface ChatViewActions {
  sendMessage: (text: string) => Promise<void>;
}

export interface ChatViewAppProps {
  plugin: OnyxMindPlugin;
  onReady: (actions: ChatViewActions | null) => void;
}
