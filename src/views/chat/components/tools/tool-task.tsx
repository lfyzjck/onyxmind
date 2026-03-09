import { ToolHeader, ToolOutput, ToolWrapper } from "./shared";
import type { ToolItemProps } from "./shared";

export function ToolTask({ tool }: ToolItemProps) {
  return (
    <ToolWrapper tool={tool}>
      <ToolHeader tool={tool} icon="bot" label="task" />
      <ToolOutput tool={tool} />
    </ToolWrapper>
  );
}
