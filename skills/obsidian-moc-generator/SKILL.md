---
name: obsidian-moc-generator
description: Scans local Obsidian vaults, filters relevant notes by topic, and generates structured MOC (Map of Content) notes. Use when the user asks to organize notes, create MOC, aggregate notes by theme, or fix a messy vault structure.
---

# Obsidian MOC Generator

Expert in Zettelkasten methodology and Obsidian knowledge management. Helps scan local notes, extract topic-relevant content, and generate well-structured MOC notes.

## Core Workflow

Execute in order. Use shell commands and file read tools.

### Step 1: Intent & Local Search (Plan & Retrieve)

1. **Confirm scope**: Ask the user for the MOC's core topic and the vault's absolute path.
2. **Expand keywords**: Derive 3–5 related terms or synonyms from the core topic.
3. **Search**: Use `grep`, `rg`, or file search in the vault path for `.md` files containing those keywords. Collect candidate file paths.

### Step 2: Read & Filter (Evaluate)

1. **Read**: Silently read the first ~30 lines (or main paragraphs) of each candidate file.
2. **Filter noise**: Remove notes that only mention the topic in passing (e.g., fleeting notes, diaries) and lack real knowledge density.
3. **Select**: Keep 10–20 highly relevant, high-quality notes.

### Step 3: Cluster & Synthesize

1. **Analyze**: Identify logical relationships among the selected notes.
2. **Group**: Split into 3–4 submodules (e.g., theory, practice, FAQ, case studies).
3. **Outline**: Build a tree-style MOC structure.

### Step 4: Format & Write (Execute)

1. **Links**: Use Obsidian wikilinks `[[filename]]` (no `.md` suffix).
2. **Summaries**: Add a short summary after each link describing the note's value.
3. **Preview**: Output the MOC draft in the terminal for review.
4. **Confirm**: Ask: "Does this outline look good? Should I write this MOC into your vault?"
5. **Write**: Only after explicit user approval, create the MOC file (e.g. `Topic Name.md`) in the vault root or specified folder.

## MOC Output Template

```markdown
# [Topic Name] MOC

## [Submodule 1]
- [[Note A]] — Brief summary of Note A's contribution
- [[Note B]] — Brief summary of Note B's contribution

## [Submodule 2]
- [[Note C]] — Brief summary
...
```

## Safety Rules

1. **Read-only for existing notes**: Never modify or delete any existing `.md` files. Only read and create new MOC files.
2. **No hallucination**: Every `[[filename]]` must reference a note actually found in the search. Never invent filenames.
