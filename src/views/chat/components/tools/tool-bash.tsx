import { ToolHeader, ToolOutput, ToolWrapper } from "./shared";
import type { ToolItemProps } from "./shared";

export function ToolBash({ tool }: ToolItemProps) {
  return (
    <ToolWrapper tool={tool}>
      <ToolHeader tool={tool} icon="terminal" label="bash" />
      <ToolOutput tool={tool} />
    </ToolWrapper>
  );
}
