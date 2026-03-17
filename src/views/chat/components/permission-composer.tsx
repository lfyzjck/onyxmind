import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { StreamChunkToolUse } from "../../../services/opencode-service";
import { ObsidianIcon } from "./tools/shared";

interface PermissionComposerProps {
  permission: StreamChunkToolUse;
  onReply: (
    requestId: string,
    reply: "once" | "always" | "reject",
  ) => Promise<void>;
}

export function PermissionComposer({
  permission,
  onReply,
}: PermissionComposerProps) {
  const requestId = permission.permissionId;
  const permType = permission.permissionType ?? "unknown";
  const patterns = permission.permissionPatterns ?? [];
  const metadata = permission.permissionMetadata ?? {};
  const diff = typeof metadata["diff"] === "string" ? metadata["diff"] : null;

  const containerRef = useRef<HTMLDivElement>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleReply = useCallback(
    async (reply: "once" | "always" | "reject") => {
      if (submitting || !requestId) return;
      setSubmitting(true);
      try {
        await onReply(requestId, reply);
      } finally {
        setSubmitting(false);
      }
    },
    [onReply, requestId, submitting],
  );

  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key === "y") {
        e.preventDefault();
        void handleReply("once");
      } else if (e.key === "a") {
        e.preventDefault();
        void handleReply("always");
      } else if (e.key === "n" || e.key === "Escape") {
        e.preventDefault();
        void handleReply("reject");
      }
    },
    [handleReply],
  );

  return (
    <div
      className="onyxmind-pc"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-label="Permission request"
    >
      <div className="onyxmind-pc-header">
        <ObsidianIcon icon="shield-alert" className="onyxmind-pc-icon" />
        <span className="onyxmind-pc-title">
          Permission required:{" "}
          <span className="onyxmind-pc-type">{permType}</span>
        </span>
      </div>

      {patterns.length > 0 && (
        <div className="onyxmind-pc-patterns">
          {patterns.map((p, i) => (
            <span key={i} className="onyxmind-pc-pattern">
              {p}
            </span>
          ))}
        </div>
      )}

      {diff && (
        <details className="onyxmind-pc-diff">
          <summary>View diff</summary>
          <pre className="onyxmind-pc-diff-content">{diff}</pre>
        </details>
      )}

      <div className="onyxmind-pc-footer">
        <span className="onyxmind-pc-hint">Y Allow once</span>
        <span className="onyxmind-pc-hint">A Allow always</span>
        <span className="onyxmind-pc-hint">N Deny</span>
        <div className="onyxmind-pc-actions">
          <button
            type="button"
            className="onyxmind-pc-btn onyxmind-pc-btn-deny"
            disabled={submitting}
            aria-label="Deny permission"
            onClick={() => void handleReply("reject")}
          >
            <ObsidianIcon icon="x" className="onyxmind-btn-icon" />
            Deny
          </button>
          <button
            type="button"
            className="onyxmind-pc-btn onyxmind-pc-btn-once"
            disabled={submitting}
            aria-label="Allow once"
            onClick={() => void handleReply("once")}
          >
            <ObsidianIcon icon="check" className="onyxmind-btn-icon" />
            Allow once
          </button>
          <button
            type="button"
            className="onyxmind-pc-btn onyxmind-pc-btn-always"
            disabled={submitting}
            aria-label="Allow always"
            onClick={() => void handleReply("always")}
          >
            <ObsidianIcon icon="shield-check" className="onyxmind-btn-icon" />
            Always
          </button>
        </div>
      </div>
    </div>
  );
}
