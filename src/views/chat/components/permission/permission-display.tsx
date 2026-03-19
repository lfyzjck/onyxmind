import { ObsidianIcon, ToolHeader, ToolWrapper } from "../tools/shared";
import type { ToolItemProps } from "../tools/shared";

export function PermissionDisplay({ tool }: ToolItemProps) {
  const permType = tool.title ?? "unknown";
  const rawPatterns = tool.input?.["patterns"];
  const patterns: string[] = Array.isArray(rawPatterns)
    ? (rawPatterns as string[])
    : [];

  // When status is still "running" in historical view, the session was interrupted.
  const isAbandoned = tool.status === "running";
  const isCompleted = tool.status === "completed";
  const isRejected = tool.status === "error";

  return (
    <ToolWrapper tool={tool}>
      <ToolHeader tool={tool} icon="shield-alert" label={permType} />

      {isAbandoned && (
        <div className="onyxmind-permission-readonly">
          {patterns.length > 0 && (
            <div className="onyxmind-permission-readonly-patterns">
              {patterns.map((p, i) => (
                <span key={i} className="onyxmind-permission-readonly-pattern">
                  {p}
                </span>
              ))}
            </div>
          )}
          <div className="onyxmind-question-readonly-notice">
            <ObsidianIcon
              icon="circle-slash"
              className="onyxmind-question-readonly-notice-icon"
            />
            <span>Session interrupted, permission left unanswered</span>
          </div>
        </div>
      )}

      {isCompleted && (
        <div className="onyxmind-permission-result onyxmind-permission-result-allowed">
          <ObsidianIcon
            icon="shield-check"
            className="onyxmind-permission-result-icon"
          />
          <span>Allowed</span>
          {patterns.length > 0 && (
            <div className="onyxmind-permission-result-patterns">
              {patterns.map((p, i) => (
                <span key={i} className="onyxmind-permission-result-pattern">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {isRejected && (
        <div className="onyxmind-permission-result onyxmind-permission-result-denied">
          <ObsidianIcon
            icon="shield-off"
            className="onyxmind-permission-result-icon"
          />
          <span>Denied</span>
        </div>
      )}
    </ToolWrapper>
  );
}
