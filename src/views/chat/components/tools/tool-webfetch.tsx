import { ToolHeader, ToolOutput, ToolWrapper } from "./shared";
import type { ToolItemProps } from "./shared";

export function ToolWebfetch({ tool }: ToolItemProps) {
  return (
    <ToolWrapper tool={tool}>
      <ToolHeader tool={tool} icon="globe" label="webfetch" />
      <ToolOutput tool={tool} />
    </ToolWrapper>
  );
}
