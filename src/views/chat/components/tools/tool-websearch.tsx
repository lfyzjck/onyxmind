import { ToolHeader, ToolOutput, ToolWrapper } from "./shared";
import type { ToolItemProps } from "./shared";

export function ToolWebsearch({ tool }: ToolItemProps) {
  const strippedTitle = tool.title?.replace(/^Web search:\s*/, "") ?? "";
  return (
    <ToolWrapper tool={tool}>
      <ToolHeader
        tool={{ ...tool, title: strippedTitle }}
        icon="search"
        label="websearch"
      />
      <ToolOutput tool={tool} />
    </ToolWrapper>
  );
}
