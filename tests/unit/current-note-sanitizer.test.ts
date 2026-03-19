import { test, expect } from "vitest";
import { stripCurrentNoteBlocks } from "../../src/views/chat/current-note-sanitizer";

test("returns original content when current_note block does not exist", () => {
  const content = "Hello\n\n[[note]]";
  expect(stripCurrentNoteBlocks(content)).toBe(content);
});

test("removes a trailing <current_note> block", () => {
  const content =
    "转化为 canvas\n\n<current_note>\n2026年美伊战争战报时间线.md\n</current_note>";

  expect(stripCurrentNoteBlocks(content)).toBe("转化为 canvas");
});

test("removes current_note block in the middle and keeps surrounding text", () => {
  const content = "before\n\n<current_note>\nA.md\n</current_note>\n\nafter";
  expect(stripCurrentNoteBlocks(content)).toBe("before\n\nafter");
});

test("removes multiple current_note blocks", () => {
  const content =
    "start\n<current_note>\nA.md\n</current_note>\nmid\n<current_note>\nB.md\n</current_note>\nend";
  expect(stripCurrentNoteBlocks(content)).toBe("start\nmid\nend");
});

test("returns empty string when content is only current_note block", () => {
  const content = "<current_note>\nA.md\n</current_note>";
  expect(stripCurrentNoteBlocks(content)).toBe("");
});
