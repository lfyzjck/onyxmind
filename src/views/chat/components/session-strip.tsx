import type { OnyxMindSession } from "../../../services/session-manager";
import {
  ARIA_LABEL_CLEAR_MESSAGES,
  ARIA_LABEL_NEW_SESSION,
  ARIA_LABEL_SESSION_HISTORY,
  CLASS_IS_ACTIVE,
  LABEL_NO_SESSIONS,
} from "../constants";
import { SessionHistoryMenu } from "./session-history-menu";

interface SessionStripProps {
  sessions: OnyxMindSession[];
  activeSessionId: string | null;
  historyMenuOpen: boolean;
  historySessions: OnyxMindSession[];
  historySelectedIndex: number;
  onSwitchSession: (sessionId: string) => void;
  onCloseSession: (sessionId: string) => void;
  onNewSession: () => void;
  onClearMessages: () => void;
  onToggleHistory: () => void;
  onLoadHistorySession: (sessionId: string) => void;
  onSetHistorySelectedIndex: (index: number) => void;
  onCloseHistoryMenu: () => void;
}

export function SessionStrip(props: SessionStripProps) {
  const {
    sessions,
    activeSessionId,
    historyMenuOpen,
    historySessions,
    historySelectedIndex,
    onSwitchSession,
    onCloseSession,
    onNewSession,
    onClearMessages,
    onToggleHistory,
    onLoadHistorySession,
    onSetHistorySelectedIndex,
    onCloseHistoryMenu,
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
        <div className="onyxmind-history-container">
          <button
            className="onyxmind-icon-button"
            aria-label={ARIA_LABEL_SESSION_HISTORY}
            onClick={onToggleHistory}
          >
            📜
          </button>
          {historyMenuOpen && (
            <SessionHistoryMenu
              sessions={historySessions}
              selectedIndex={historySelectedIndex}
              onSelectSession={onLoadHistorySession}
              onSetSelectedIndex={onSetHistorySelectedIndex}
              onClose={onCloseHistoryMenu}
            />
          )}
        </div>
      </div>
    </div>
  );
}
