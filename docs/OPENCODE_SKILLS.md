# OpenCode Custom Skills Configuration Guide

> Reference: https://open-code.ai/en/docs/skills

## Overview

Skills are reusable AI agent instructions that are loaded on demand via the native `skill` tool. The agent sees a list of available skills and loads the full content when needed.

---

## 1. Placement

OpenCode automatically discovers skills from the following directories (one folder per skill, each containing a `SKILL.md`):

### Project-local

| Path                               | Description             |
| ---------------------------------- | ----------------------- |
| `.opencode/skills/<name>/SKILL.md` | OpenCode project config |
| `.claude/skills/<name>/SKILL.md`   | Claude Code compatible  |
| `.agents/skills/<name>/SKILL.md`   | Agent compatible        |

### Global

| Path                                        | Description     |
| ------------------------------------------- | --------------- |
| `~/.config/opencode/skills/<name>/SKILL.md` | Global OpenCode |
| `~/.claude/skills/<name>/SKILL.md`          | Global Claude   |
| `~/.agents/skills/<name>/SKILL.md`          | Global Agent    |

### Working Directory in OnyxMind

When OnyxMind creates a session, it sets `directory` to the **vault root path**. Therefore:

- **Inside the vault**: Create `.opencode/skills/<name>/SKILL.md` in the vault root directory for it to be discovered
- **Global**: Skills under `~/.config/opencode/skills/` are always available

---

## 2. SKILL.md Format

Each `SKILL.md` must begin with YAML frontmatter and **must** include `name` and `description`:

```yaml
---
name: git-release          # Required, must match the directory name
description: Create consistent releases and changelogs  # Required, 1-1024 characters
license: MIT               # Optional
compatibility: opencode    # Optional
metadata:                  # Optional
  audience: maintainers
  workflow: github
---

## What I do

- Draft release notes from merged PRs
- Propose a version bump
- Provide a copy-pasteable `gh release create` command

## When to use me

Use this when you are preparing a tagged release.
Ask clarifying questions if the target versioning scheme is unclear.
```

### Naming Rules

`name` must:

- Match the directory name containing `SKILL.md`
- Lowercase alphanumeric, separated by single hyphens
- 1–64 characters
- Not contain consecutive `--`
- Not start or end with `-`

Equivalent regex: `^[a-z0-9]+(-[a-z0-9]+)*$`

---

## 3. Example: Creating an Obsidian Skill in the Vault

Create `.opencode/skills/obsidian-notes/SKILL.md` in the vault root:

```markdown
---
name: obsidian-notes
description: Handle notes in an Obsidian vault, following Markdown and wiki-link best practices
---

## What I do

- Create, edit, and rename notes
- Manage frontmatter and tags
- Establish wiki-links ([[link]])
- Organize notes according to vault structure

## When to use me

Use this skill when the user needs to manage Obsidian notes, create new notes, or organize a knowledge base.
```

---

## 4. Permission Configuration

Configure in `opencode.json` (project root or `~/.config/opencode/opencode.json`):

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

| Permission | Behavior                                  |
| ---------- | ----------------------------------------- |
| `allow`    | Load immediately                          |
| `deny`     | Hidden from the agent, access denied      |
| `ask`      | Requires user confirmation before loading |

Wildcards are supported: `internal-*` matches `internal-docs`, `internal-tools`, etc.

### Per-Agent Override

In the agent's frontmatter:

```yaml
---
permission:
  skill:
    "documents-*": "allow"
---
```

Configure for built-in agents in `opencode.json`:

```json
{
  "agent": {
    "plan": {
      "permission": {
        "skill": {
          "internal-*": "allow"
        }
      }
    }
  }
}
```

---

## 5. Disabling the Skill Tool

If an agent should not use skills, it can be completely disabled:

**Custom agent:**

```yaml
---
tools:
  skill: false
---
```

**opencode.json:**

```json
{
  "agent": {
    "plan": {
      "tools": {
        "skill": false
      }
    }
  }
}
```

---

## 6. Custom Configuration Directory (OPENCODE_CONFIG_DIR)

To load skills from a non-standard directory, set the environment variable:

```bash
export OPENCODE_CONFIG_DIR=/path/to/my/config-directory
opencode serve
```

This directory will be searched like `.opencode` and must contain a `skills/` subdirectory.

**OnyxMind integration**: The current `createOpencodeServerPatched` passes config via `OPENCODE_CONFIG_CONTENT`. To add an additional skills directory, you can add `OPENCODE_CONFIG_DIR` to the `env` of the spawned process in `opencode-server.ts`.

---

## 7. Environment Variables

| Variable                              | Description                                   |
| ------------------------------------- | --------------------------------------------- |
| `OPENCODE_CONFIG`                     | Custom config file path                       |
| `OPENCODE_CONFIG_DIR`                 | Custom config directory (includes skills)     |
| `OPENCODE_CONFIG_CONTENT`             | Inline JSON config (already used by OnyxMind) |
| `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS` | Disable loading of `.claude/skills`           |

---

## 8. Troubleshooting

If a skill does not appear:

1. Check permissions: skills set to `deny` are not visible to the agent
2. Ensure `name` and `description` are present in the frontmatter
3. Confirm `SKILL.md` is spelled in all uppercase
4. Ensure skill names are unique across all locations
