import type { OnyxMindSession } from "../../../services/session-manager";
import { CLASS_IS_SELECTED } from "../constants";

interface SessionHistoryMenuProps {
  sessions: OnyxMindSession[];
  selectedIndex: number;
  onSelectSession: (sessionId: string) => void;
  onSetSelectedIndex: (index: number) => void;
  onClose: () => void;
}

export function SessionHistoryMenu(props: SessionHistoryMenuProps) {
  const { sessions, selectedIndex, onSelectSession, onSetSelectedIndex } =
    props;

  // Format timestamp to readable date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  return (
    <div
      className="onyxmind-history-menu"
      role="listbox"
      aria-label="Session history"
    >
      {sessions.length === 0 && (
        <div className="onyxmind-history-empty">No session history</div>
      )}
      {sessions.map((session, index) => (
        <button
          key={session.id}
          type="button"
          role="option"
          aria-selected={index === selectedIndex}
          className={`onyxmind-history-item ${index === selectedIndex ? CLASS_IS_SELECTED : ""}`}
          onMouseEnter={() => onSetSelectedIndex(index)}
          onClick={() => onSelectSession(session.id)}
        >
          <span className="onyxmind-history-title">{session.title}</span>
          <span className="onyxmind-history-date">
            {formatDate(session.createdAt)}
          </span>
        </button>
      ))}
    </div>
  );
}
