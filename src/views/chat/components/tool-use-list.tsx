import { setIcon } from 'obsidian';
import { useEffect, useRef } from 'react';
import type { StreamChunkToolUse } from '../../../services/opencode-service';
import { LABEL_OUTPUT } from '../constants';

// Lucide icon names (as used by Obsidian's setIcon API)
const TOOL_ICONS: Record<string, string> = {
	bash:      'terminal',
	read:      'file-text',
	write:     'file-plus',
	edit:      'file-pen-line',
	glob:      'folder-search',
	grep:      'text-search',
	task:      'bot',
	question:  'help-circle',
	webfetch:  'globe',
	websearch: 'search',
};

const STATUS_ICONS: Record<string, string> = {
	running:   'loader',
	completed: 'check',
	error:     'alert-circle',
};

function toolIconName(name: string): string {
	return TOOL_ICONS[name.toLowerCase()] ?? 'wrench';
}

function statusIconName(status: StreamChunkToolUse['status']): string {
	return STATUS_ICONS[status] ?? 'minus';
}

interface ObsidianIconProps {
	icon: string;
	className?: string;
}

function ObsidianIcon({ icon, className }: ObsidianIconProps) {
	const ref = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (ref.current) {
			setIcon(ref.current, icon);
		}
	}, [icon]);

	return <span ref={ref} className={className} aria-hidden="true" />;
}

interface ToolUseListProps {
	tools: StreamChunkToolUse[];
}

export function ToolUseList(props: ToolUseListProps) {
	const { tools } = props;
	if (tools.length === 0) {
		return null;
	}

	return (
		<>
			{tools.map((tool) => (
				<div
					key={tool.partId}
					className="onyxmind-part-tool"
					data-part-id={tool.partId}
					data-tool={tool.tool}
					data-status={tool.status}
				>
					<div className="onyxmind-tool-header">
						<ObsidianIcon
							icon={toolIconName(tool.tool)}
							className="onyxmind-tool-icon"
						/>
						<span className="onyxmind-tool-name">{tool.tool}</span>
						<span className="onyxmind-tool-title">{tool.title ?? ''}</span>
						<ObsidianIcon
							icon={statusIconName(tool.status)}
							className="onyxmind-tool-status-icon"
						/>
					</div>
					{(tool.output !== undefined || tool.error) && (
						<details className="onyxmind-tool-output" open={tool.status === 'error'}>
							<summary>{LABEL_OUTPUT}</summary>
							<div className="onyxmind-tool-output-content">
								{tool.error ? (
									<div className="onyxmind-tool-output-error">{tool.error}</div>
								) : (
									<pre>{tool.output}</pre>
								)}
							</div>
						</details>
					)}
				</div>
			))}
		</>
	);
}
