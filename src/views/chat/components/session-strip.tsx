import type { Session } from '../../../services/session-manager';

interface SessionStripProps {
	sessions: Session[];
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
					<div className="onyxmind-session-empty">No sessions</div>
				)}
				{sessions.map((session, index) => (
					<button
						key={session.id}
						className={`onyxmind-session-item ${session.id === activeSessionId ? 'is-active' : ''}`}
						aria-label={`Switch to session ${index + 1}`}
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
								if (event.key === 'Enter' || event.key === ' ') {
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
					aria-label="New session"
					onClick={onNewSession}
				>
					+
				</button>
				<button
					className="onyxmind-icon-button"
					aria-label="Clear messages"
					onClick={onClearMessages}
				>
					⌫
				</button>
				<button
					className="onyxmind-icon-button"
					aria-label="Refresh sessions"
					onClick={onRefresh}
				>
					↻
				</button>
			</div>
		</div>
	);
}
