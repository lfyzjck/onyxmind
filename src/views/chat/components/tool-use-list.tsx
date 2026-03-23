import type { ComponentType } from "react";
import type { StreamChunkToolUse } from "../../../core/stream";
import type { ToolItemProps } from "./tools/shared";
import { ToolBash } from "./tools/tool-bash";
import { ToolDefault } from "./tools/tool-default";
import { ToolEdit } from "./tools/tool-edit";
import { ToolGlob } from "./tools/tool-glob";
import { ToolGrep } from "./tools/tool-grep";
import { PermissionDisplay } from "./permission/permission-display";
import { QuestionDisplay } from "./question/question-display";
import { ToolRead } from "./tools/tool-read";
import { ToolTask } from "./tools/tool-task";
import { ToolWebfetch } from "./tools/tool-webfetch";
import { ToolWebsearch } from "./tools/tool-websearch";
import { ToolWrite } from "./tools/tool-write";

const TOOL_REGISTRY: Record<string, ComponentType<ToolItemProps>> = {
  bash: ToolBash,
  read: ToolRead,
  write: ToolWrite,
  edit: ToolEdit,
  glob: ToolGlob,
  grep: ToolGrep,
  task: ToolTask,
  question: QuestionDisplay,
  permission: PermissionDisplay,
  webfetch: ToolWebfetch,
  websearch: ToolWebsearch,
};

interface ToolUseListProps {
  tools: StreamChunkToolUse[];
  vaultPath?: string;
}

export function ToolUseList({ tools, vaultPath }: ToolUseListProps) {
  if (tools.length === 0) {
    return null;
  }

  return (
    <>
      {tools.map((tool) => {
        const Component = TOOL_REGISTRY[tool.tool.toLowerCase()] ?? ToolDefault;
        return (
          <Component key={tool.partId} tool={tool} vaultPath={vaultPath} />
        );
      })}
    </>
  );
}
