import { ToolHeader, ToolOutput, ToolWrapper } from "./shared";
import type { ToolItemProps } from "./shared";

export function ToolGlob({ tool }: ToolItemProps) {
  return (
    <ToolWrapper tool={tool}>
      <ToolHeader tool={tool} icon="folder-search" label="glob" />
      <ToolOutput tool={tool} />
    </ToolWrapper>
  );
}
