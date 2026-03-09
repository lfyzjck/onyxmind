import type { OnyxMindSession } from "../../../services/session-manager";
import {
  ARIA_LABEL_CLEAR_MESSAGES,
  ARIA_LABEL_NEW_SESSION,
  ARIA_LABEL_REFRESH_SESSIONS,
  CLASS_IS_ACTIVE,
  LABEL_NO_SESSIONS,
} from "../constants";

interface SessionStripProps {
  sessions: OnyxMindSession[];
  activeSessionId: string | null;
  onSwitchSession: (sessionId: string) => void;
  onCloseSession: (sessionId: string) => void;
  onNewSession: () => void;
  onClearMessages: () => void;
  onRefresh: () => void;
}

export function SessionStrip(props: SessionStripProps) {
  const {
    sessions,
    activeSessionId,
    onSwitchSession,
    onCloseSession,
    onNewSession,
    onClearMessages,
    onRefresh,
  } = props;

  return (
    <div className="onyxmind-session-strip">
      <div className="onyxmind-session-list">
        {sessions.length === 0 && (
          <div className="onyxmind-session-empty">{LABEL_NO_SESSIONS}</div>
        )}
        {sessions.map((session, index) => (
          <button
            key={session.id}
            className={`onyxmind-session-item ${session.id === activeSessionId ? CLASS_IS_ACTIVE : ""}`}
            aria-label={session.title}
            title={session.title}
            onClick={() => onSwitchSession(session.id)}
          >
            <span className="onyxmind-session-index">{index + 1}</span>
            <span
              className="onyxmind-session-close"
              role="button"
              tabIndex={0}
              aria-label={`Close session ${index + 1}`}
              onClick={(event) => {
                event.stopPropagation();
                onCloseSession(session.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  onCloseSession(session.id);
                }
              }}
            >
              ×
            </span>
          </button>
        ))}
      </div>

      <div className="onyxmind-strip-actions">
        <button
          className="onyxmind-icon-button"
          aria-label={ARIA_LABEL_NEW_SESSION}
          onClick={onNewSession}
        >
          +
        </button>
        <button
          className="onyxmind-icon-button"
          aria-label={ARIA_LABEL_CLEAR_MESSAGES}
          onClick={onClearMessages}
        >
          ⌫
        </button>
        <button
          className="onyxmind-icon-button"
          aria-label={ARIA_LABEL_REFRESH_SESSIONS}
          onClick={onRefresh}
        >
          ↻
        </button>
      </div>
    </div>
  );
}
