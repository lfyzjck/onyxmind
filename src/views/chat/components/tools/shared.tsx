import { setIcon } from "obsidian";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import type { StreamChunkToolUse } from "../../../../services/opencode-service";
import { LABEL_OUTPUT } from "../../constants";

export interface ToolItemProps {
  tool: StreamChunkToolUse;
  vaultPath?: string;
}

export function toRelativePath(
  title: string | undefined,
  vaultPath: string | undefined,
): string {
  if (!title || !vaultPath) return title ?? "";
  const normalized = vaultPath
    .substring(1)
    .replace(/[/\\]+$/, "")
    .replace(/\\/g, "/");
  const normalizedTitle = title.replace(/\\/g, "/");
  if (normalizedTitle.startsWith(normalized)) {
    return (
      normalizedTitle.slice(normalized.length).replace(/^\/+/, "") || title
    );
  }
  return title;
}

const STATUS_ICONS: Record<string, string> = {
  running: "loader",
  completed: "check",
  error: "alert-circle",
};

export function statusIconName(status: StreamChunkToolUse["status"]): string {
  return STATUS_ICONS[status] ?? "minus";
}

export function ObsidianIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      setIcon(ref.current, icon);
    }
  }, [icon]);

  return <span ref={ref} className={className} aria-hidden="true" />;
}

export function ToolWrapper({
  tool,
  children,
}: {
  tool: StreamChunkToolUse;
  children: ReactNode;
}) {
  return (
    <div
      className="onyxmind-part-tool"
      data-part-id={tool.partId}
      data-tool={tool.tool}
      data-status={tool.status}
    >
      {children}
    </div>
  );
}

export function ToolHeader({
  tool,
  icon,
  label,
  subtitle,
}: {
  tool: StreamChunkToolUse;
  icon: string;
  label?: string;
  subtitle?: string;
}) {
  const displayName = label ?? tool.tool;
  return (
    <div className="onyxmind-tool-header">
      <ObsidianIcon icon={icon} className="onyxmind-tool-icon" />
      {displayName ? (
        <span className="onyxmind-tool-name">{displayName}</span>
      ) : null}
      <span className="onyxmind-tool-title">
        {subtitle ?? tool.title ?? ""}
      </span>
      <ObsidianIcon
        icon={statusIconName(tool.status)}
        className="onyxmind-tool-status-icon"
      />
    </div>
  );
}

export function ToolOutput({ tool }: { tool: StreamChunkToolUse }) {
  if (tool.output === undefined && !tool.error) {
    return null;
  }
  return (
    <details className="onyxmind-tool-output" open={tool.status === "error"}>
      <summary>
        <ObsidianIcon
          icon="chevron-right"
          className="onyxmind-tool-output-toggle"
        />
        <span>{LABEL_OUTPUT}</span>
      </summary>
      <div className="onyxmind-tool-output-content">
        {tool.error ? (
          <div className="onyxmind-tool-output-error">{tool.error}</div>
        ) : (
          <pre>{tool.output}</pre>
        )}
      </div>
    </details>
  );
}
