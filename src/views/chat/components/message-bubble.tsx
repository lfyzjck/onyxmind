import type OnyxMindPlugin from "../../../main";
import type { Message } from "../../../services/opencode-service";
import { MarkdownBlock } from "./markdown-block";
import { ToolUseList } from "./tool-use-list";
import {
  CSS_CLASS_MESSAGE_HAS_THINKING,
  CSS_CLASS_PART_TEXT,
} from "../constants";

interface MessageBubbleProps {
  plugin: OnyxMindPlugin;
  message: Message;
}

export function MessageBubble(props: MessageBubbleProps) {
  const { plugin, message } = props;
  const messageTools = message.tools ?? [];
  const shouldShowToolCalls =
    message.role === "assistant" &&
    plugin.settings.showToolCallsAfterStreaming &&
    messageTools.length > 0;
  const hasThinkingLabel =
    message.role === "assistant" && message.hasThinking === true;
  const containerClassName = [
    "onyxmind-message",
    `onyxmind-message-${message.role}`,
    hasThinkingLabel ? CSS_CLASS_MESSAGE_HAS_THINKING : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      <div className="onyxmind-message-body">
        {shouldShowToolCalls && <ToolUseList tools={messageTools} />}
        <MarkdownBlock
          plugin={plugin}
          content={message.content}
          className={CSS_CLASS_PART_TEXT}
        />
      </div>
    </div>
  );
}
