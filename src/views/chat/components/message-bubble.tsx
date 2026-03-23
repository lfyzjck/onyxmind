import type OnyxMindPlugin from "../../../main";
import type { Message } from "../../../core/stream";
import { MarkdownBlock } from "./markdown-block";
import { ToolUseList } from "./tool-use-list";
import {
  CSS_CLASS_MESSAGE_HAS_THINKING,
  CSS_CLASS_PART_TEXT,
} from "../constants";
import {
  messageHasThinkingLabel,
  shouldShowHistoricalToolCalls,
} from "../render-state";

interface MessageBubbleProps {
  plugin: OnyxMindPlugin;
  message: Message;
}

export function MessageBubble(props: MessageBubbleProps) {
  const { plugin, message } = props;
  const messageTools = message.tools ?? [];
  const shouldShowToolCalls = shouldShowHistoricalToolCalls(
    message,
    plugin.settings.showToolCallsAfterStreaming,
  );
  const hasThinkingLabel = messageHasThinkingLabel(message);
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
        {shouldShowToolCalls && (
          <ToolUseList
            tools={messageTools}
            vaultPath={plugin.opencodeService.getVaultPath() ?? undefined}
          />
        )}
        <MarkdownBlock
          plugin={plugin}
          content={message.displayContent ?? message.content}
          className={CSS_CLASS_PART_TEXT}
        />
      </div>
    </div>
  );
}
