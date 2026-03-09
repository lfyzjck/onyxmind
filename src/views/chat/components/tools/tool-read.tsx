import { ToolHeader, ToolOutput, ToolWrapper, toRelativePath } from "./shared";
import type { ToolItemProps } from "./shared";

export function ToolRead({ tool, vaultPath }: ToolItemProps) {
  const relativeTitle = toRelativePath(tool.title, vaultPath);
  return (
    <ToolWrapper tool={tool}>
      <ToolHeader
        tool={{ ...tool, title: relativeTitle }}
        icon="file-text"
        label="read"
      />
      <ToolOutput tool={tool} />
    </ToolWrapper>
  );
}
