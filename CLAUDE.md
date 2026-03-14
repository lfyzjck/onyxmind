# Claude Development Guide

This document provides project-specific development guidance for the Claude AI assistant.

## Project Overview

OnyxMind is an Obsidian smart assistant plugin built on the OpenCode AI Agent framework.

**Core principles**:

- The plugin serves only as the user interaction entry point
- All AI processing and file operations are performed by the OpenCode Agent on the server
- Communication with the service is via the OpenCode SDK

## Reference Resources

### Code Reference

When implementing plugin features and encountering uncertain issues, you may refer to the following project’s code:

**infio-copilot** (Obsidian plugin with similar functionality)

- Path: `/Users/jiachengkun/opensource/infio-copilot`
- Use: Reference for UI implementation, Obsidian API usage patterns, and user interaction design

### Technical Documentation

- OpenCode SDK: https://opencode.ai/docs/sdk/
- Obsidian API: https://docs.obsidian.md
- Project design docs: see `PRD.md`, `ARCHITECTURE.md`, `OBSIDIAN_BEST_PRACTICES.md`

## Development Standards

### Mandatory Obsidian Best Practices

1. **Memory management**
   - ✅ Use registration methods such as `registerEvent()`, `addCommand()`
   - ❌ Do not store view references in plugin properties

2. **Type safety**
   - ✅ Use `instanceof` to check TFile/TFolder
   - ❌ Do not use type assertions (as TFile)

3. **Naming conventions**
   - Plugin ID: "onyxmind"
   - Command names: sentence case (e.g. "Open chat")
   - Do not include the word "command"

4. **File operations**
   - ✅ Use Editor API to edit the active file
   - ✅ Use `Vault.process()` for background file modifications
   - ✅ Use `requestUrl()` instead of `fetch()`

5. **Accessibility (required)**
   - All interactive elements must support keyboard navigation
   - Add aria-label to icon buttons
   - Use `:focus-visible` for focus styles

See `OBSIDIAN_BEST_PRACTICES.md` for full details.

## Project Structure

```
onyxmind/
├── src/
│   ├── services/
│   ├── views/
│   │   └── chat/
│   │       ├── components/
│   │       │   └── tools/
│   │       └── hooks/
│   ├── utils/
│   └── commands/
├── docs/
├── tests/
└── .github/
    └── workflows/
```

## Development Workflow

1. We follow a fail-fast approach; do not add defensive/error-handling code unless necessary.
2. After writing code, run `bun run lint` to check formatting and fix any issues.
3. After all checks pass, run `bun run build` to build the plugin.
