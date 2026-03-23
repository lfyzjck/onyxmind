import { ToolHeader, ToolOutput, ToolWrapper, toRelativePath } from "./shared";
import type { ToolItemProps } from "./shared";

export function ToolGlob({ tool, vaultPath }: ToolItemProps) {
  const relativeTitle = toRelativePath(tool.title, vaultPath);
  return (
    <ToolWrapper tool={tool}>
      <ToolHeader
        tool={{ ...tool, title: relativeTitle }}
        icon="folder-search"
        label="glob"
      />
      <ToolOutput tool={tool} />
    </ToolWrapper>
  );
}
