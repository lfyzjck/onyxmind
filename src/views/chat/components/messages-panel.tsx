import { MessageBubble } from "./message-bubble";
import { StreamingBubble } from "./streaming-bubble";
import type OnyxMindPlugin from "../../../main";
import type {
  Message,
  StreamChunkToolUse,
} from "../../../services/opencode-service";
import type { RefObject } from "react";
import { LABEL_ERROR, LABEL_RUNNING } from "../constants";

interface MessagesPanelProps {
  plugin: OnyxMindPlugin;
  messagesRef: RefObject<HTMLDivElement | null>;
  messages: Message[];
  isStreaming: boolean;
  streamText: string;
  streamThinking: string;
  streamTools: StreamChunkToolUse[];
  errors: string[];
}

export function MessagesPanel(props: MessagesPanelProps) {
  const {
    plugin,
    messagesRef,
    messages,
    isStreaming,
    streamText,
    streamThinking,
    streamTools,
    errors,
  } = props;

  const showWelcome = messages.length === 0 && !isStreaming;

  return (
    <div className="onyxmind-messages" ref={messagesRef}>
      {showWelcome && (
        <div className="onyxmind-welcome">
          搜索笔记、组织主题，或直接输入问题开始对话。输入 <code>/</code>{" "}
          可选择可用命令。
        </div>
      )}

      {messages.map((message, idx) => (
        <MessageBubble
          key={`${message.timestamp}-${idx}`}
          plugin={plugin}
          message={message}
        />
      ))}

      {isStreaming && (
        <StreamingBubble
          plugin={plugin}
          text={streamText}
          thinking={streamThinking}
          tools={streamTools}
        />
      )}

      <div
        className="onyxmind-thinking"
        style={{ display: isStreaming ? "flex" : "none" }}
      >
        <span>{LABEL_RUNNING}</span>
      </div>

      {errors.map((error, idx) => (
        <div className="onyxmind-error" key={`${idx}-${error}`}>
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
            <span>{LABEL_ERROR}</span>
          </div>
          <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {error}
          </div>
        </div>
      ))}
    </div>
  );
}
