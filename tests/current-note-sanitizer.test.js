import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import createJiti from "jiti";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jiti = createJiti(__filename);
const { stripCurrentNoteBlocks } = jiti(
  path.resolve(__dirname, "../src/views/chat/current-note-sanitizer.ts"),
);

test("returns original content when current_note block does not exist", () => {
  const content = "Hello\n\n[[note]]";
  assert.equal(stripCurrentNoteBlocks(content), content);
});

test("removes a trailing <current_note> block", () => {
  const content =
    "转化为 canvas\n\n<current_note>\n2026年美伊战争战报时间线.md\n</current_note>";

  assert.equal(stripCurrentNoteBlocks(content), "转化为 canvas");
});

test("removes current_note block in the middle and keeps surrounding text", () => {
  const content = "before\n\n<current_note>\nA.md\n</current_note>\n\nafter";
  assert.equal(stripCurrentNoteBlocks(content), "before\n\nafter");
});

test("removes multiple current_note blocks", () => {
  const content =
    "start\n<current_note>\nA.md\n</current_note>\nmid\n<current_note>\nB.md\n</current_note>\nend";
  assert.equal(stripCurrentNoteBlocks(content), "start\nmid\nend");
});

test("returns empty string when content is only current_note block", () => {
  const content = "<current_note>\nA.md\n</current_note>";
  assert.equal(stripCurrentNoteBlocks(content), "");
});
