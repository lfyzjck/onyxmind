export interface SlashMatch {
	start: number;
	end: number;
	query: string;
}

export function findSlashMatch(text: string, cursor: number): SlashMatch | null {
	const beforeCursor = text.slice(0, cursor);
	const match = /(?:^|\s)\/([^\s/]*)$/.exec(beforeCursor);
	if (!match) {
		return null;
	}

	const query = match[1] ?? '';
	const start = cursor - query.length - 1;
	if (start < 0) {
		return null;
	}

	return {
		start,
		end: cursor,
		query,
	};
}
