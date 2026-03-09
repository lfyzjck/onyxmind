import { ToolHeader, ToolOutput, ToolWrapper, toRelativePath } from "./shared";
import type { ToolItemProps } from "./shared";

export function ToolWrite({ tool, vaultPath }: ToolItemProps) {
  const relativeTitle = toRelativePath(tool.title, vaultPath);
  return (
    <ToolWrapper tool={tool}>
      <ToolHeader
        tool={{ ...tool, title: relativeTitle }}
        icon="file-plus"
        label="write"
      />
      <ToolOutput tool={tool} />
    </ToolWrapper>
  );
}
