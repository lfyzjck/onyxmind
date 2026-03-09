const CURRENT_NOTE_BLOCK_PATTERN =
  /(?:\r?\n)?<current_note>\s*[\s\S]*?\s*<\/current_note>(?:\r?\n)?/gi;

/**
 * Removes internal <current_note>...</current_note> metadata from chat message
 * content so it won't be shown in UI.
 */
export function stripCurrentNoteBlocks(content: string): string {
  if (!content.includes("<current_note>")) {
    return content;
  }

  const normalizedContent = content.replace(/\r\n/g, "\n");
  const stripped = normalizedContent.replace(CURRENT_NOTE_BLOCK_PATTERN, "\n");

  return stripped.replace(/\n{3,}/g, "\n\n").trim();
}
