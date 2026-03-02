import type OnyxMindPlugin from '../../../main';
import type { StreamChunkToolUse } from '../../../services/opencode-service';
import { MarkdownBlock } from './markdown-block';
import { ToolUseList } from './tool-use-list';

interface StreamingBubbleProps {
	plugin: OnyxMindPlugin;
	text: string;
	thinking: string;
	tools: StreamChunkToolUse[];
}

export function StreamingBubble(props: StreamingBubbleProps) {
	const { plugin, text, thinking, tools } = props;
	const hasThinkingLabel = thinking.trim().length > 0;
	const containerClassName = [
		'onyxmind-message',
		'onyxmind-message-assistant',
		hasThinkingLabel ? 'onyxmind-message-has-thinking' : '',
	].filter(Boolean).join(' ');

	return (
		<div className={containerClassName}>
			<div className="onyxmind-message-body">
				{thinking.length > 0 && (
					<details className="onyxmind-part-thinking" open>
						<summary>Thought</summary>
						<div className="onyxmind-thinking-content">{thinking}</div>
					</details>
				)}

				<ToolUseList tools={tools} />

				<MarkdownBlock plugin={plugin} content={text} className="onyxmind-part-text" />
			</div>
		</div>
	);
}
