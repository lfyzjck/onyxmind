import { ToolHeader, ToolOutput, ToolWrapper } from "./shared";
import type { ToolItemProps } from "./shared";

export function ToolEdit({ tool }: ToolItemProps) {
  return (
    <ToolWrapper tool={tool}>
      <ToolHeader tool={tool} icon="file-pen-line" label="edit" />
      <ToolOutput tool={tool} />
    </ToolWrapper>
  );
}
