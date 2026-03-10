# OpenCode Tool Reference

OpenCode source directory: `/Users/jiachengkun/opensource/opencode`

---

## Core tools (always available)

| Tool          | Description                                                            |
| ------------- | ---------------------------------------------------------------------- |
| `bash`        | Execute shell commands with timeout and permission controls            |
| `read`        | Read file or directory content with pagination, image, and PDF support |
| `write`       | Create or overwrite file content                                       |
| `glob`        | Match files using glob patterns                                        |
| `grep`        | Search file content using regular expressions                          |
| `edit`        | Replace specific text in a file (supports fuzzy matching)              |
| `webfetch`    | Fetch URL content, automatically converted to Markdown                 |
| `websearch`   | Perform web searches via the Exa API                                   |
| `codesearch`  | Search code snippets and documentation                                 |
| `skill`       | Load domain-specific skills and workflows on demand                    |
| `task`        | Spawn a sub-agent session to handle a specialized task                 |
| `apply_patch` | Apply file diffs in unified patch format                               |

---

## Conditional tools (enabled by configuration)

| Tool        | Enable condition                                                             |
| ----------- | ---------------------------------------------------------------------------- |
| `question`  | app/cli/desktop client, or set `OPENCODE_ENABLE_QUESTION_TOOL`               |
| `lsp`       | Set `OPENCODE_EXPERIMENTAL_LSP_TOOL` flag                                    |
| `batch`     | Set `config.experimental.batch_tool = true` (up to 25 concurrent tool calls) |
| `plan_exit` | Set `OPENCODE_EXPERIMENTAL_PLAN_MODE` under CLI                              |
| `todowrite` | Enable on demand to write the current session's todo list                    |

---

## Tool registry

Tool registration is managed in `packages/opencode/src/tool/registry.ts` and supports:

- Loading built-in tools
- Loading custom tools from `tool/` or `tools/` directories
- Loading tools from plugins
- Filtering tools by model type and permissions
- Automatically selecting between `edit/write` and `apply_patch` based on model compatibility
