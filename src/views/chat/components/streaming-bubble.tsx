import type OnyxMindPlugin from "../../../main";
import type { StreamChunkToolUse } from "../../../core/stream";
import { MarkdownBlock } from "./markdown-block";
import { ToolUseList } from "./tool-use-list";
import {
  CSS_CLASS_MESSAGE_HAS_THINKING,
  CSS_CLASS_PART_TEXT,
} from "../constants";
import { t } from "../../../i18n";

interface StreamingBubbleProps {
  plugin: OnyxMindPlugin;
  text: string;
  thinking: string;
  tools: StreamChunkToolUse[];
}

export function StreamingBubble(props: StreamingBubbleProps) {
  const { plugin, text, thinking, tools } = props;
  const hasThinkingLabel = thinking.trim().length > 0;
  const containerClassName = [
    "onyxmind-message",
    "onyxmind-message-assistant",
    hasThinkingLabel ? CSS_CLASS_MESSAGE_HAS_THINKING : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClassName}>
      <div className="onyxmind-message-body">
        {thinking.length > 0 && (
          <details className="onyxmind-part-thinking" open>
            <summary>{t("label.thought")}</summary>
            <div className="onyxmind-thinking-content">{thinking}</div>
          </details>
        )}

        <ToolUseList
          tools={tools}
          vaultPath={plugin.opencodeService.getVaultPath()}
        />

        <MarkdownBlock
          plugin={plugin}
          content={text}
          className={CSS_CLASS_PART_TEXT}
        />
      </div>
    </div>
  );
}
