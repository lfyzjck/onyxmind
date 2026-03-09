import { ToolHeader, ToolOutput, ToolWrapper } from "./shared";
import type { ToolItemProps } from "./shared";

export function ToolDefault({ tool }: ToolItemProps) {
  return (
    <ToolWrapper tool={tool}>
      <ToolHeader tool={tool} icon="wrench" />
      <ToolOutput tool={tool} />
    </ToolWrapper>
  );
}
