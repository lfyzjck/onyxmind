import type { StreamChunkToolUse } from '../../../services/opencode-service';
import { LABEL_OUTPUT } from '../constants';

const TOOL_ICONS: Record<string, string> = {
	bash: '$',
	read: '>',
	write: '<',
	edit: '<',
	glob: '*',
	grep: '*',
	task: '#',
	question: '?',
	webfetch: '%',
	websearch: '@',
};

function toolIcon(name: string): string {
	return TOOL_ICONS[name] ?? 'o';
}

function toolStatusIcon(status: StreamChunkToolUse['status']): string {
	switch (status) {
		case 'running':
			return '...';
		case 'completed':
			return '✓';
		case 'error':
			return '!';
		default:
			return '·';
	}
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
						<span className="onyxmind-tool-icon">{toolIcon(tool.tool)}</span>
						<span className="onyxmind-tool-name">{tool.tool}</span>
						<span className="onyxmind-tool-title">{tool.title ?? ''}</span>
						<span className="onyxmind-tool-status-icon">{toolStatusIcon(tool.status)}</span>
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
