import { ARIA_LABEL_REFRESH_SESSIONS, BRAND_NAME } from '../constants';

interface ChatHeaderProps {
	scopeLabel: string;
	onRefresh: () => void;
}

export function ChatHeader(props: ChatHeaderProps) {
	const { scopeLabel, onRefresh } = props;

	return (
		<>
			<div className="onyxmind-toolbar">
				<div className="onyxmind-toolbar-group">
					<span className="onyxmind-toolbar-glyph">⌁</span>
					<span className="onyxmind-toolbar-glyph">⌗</span>
					<span className="onyxmind-toolbar-glyph">☰</span>
				</div>
				<div className="onyxmind-toolbar-group">
					<button
						className="onyxmind-toolbar-button"
						aria-label={ARIA_LABEL_REFRESH_SESSIONS}
						data-tooltip-position="bottom"
						onClick={onRefresh}
					>
						↻
					</button>
					<span className="onyxmind-toolbar-glyph">◧</span>
				</div>
			</div>

			<div className="onyxmind-brand-row">
				<span className="onyxmind-brand-icon">✶</span>
				<div className="onyxmind-brand-meta">
					<div className="onyxmind-brand-title">{BRAND_NAME}</div>
					<div className="onyxmind-header-scope">{scopeLabel}</div>
				</div>
			</div>
		</>
	);
}
