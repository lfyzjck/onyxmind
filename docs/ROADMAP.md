# OnyxMind Implementation Roadmap

> Last updated: 2026-03-02

## Current Progress Overview

| Phase                       | Status         | Completion |
| --------------------------- | -------------- | ---------- |
| Phase 0: Preparation        | ✅ Complete    | 100%       |
| Phase 1: MVP Core Features  | ✅ Complete    | 100%       |
| Phase 2: Enhanced Features  | 🔄 In Progress | 82%        |
| Phase 3: Editor Integration | 🔄 In Progress | 35%        |
| Phase 4: Optimization       | 🔄 In Progress | 12%        |
| Phase 5: Release Prep       | ⏳ Not Started | 0%         |

---

## Phase 0: Preparation ✅

### Environment Setup

- [x] Basic project structure
- [x] Install OpenCode SDK (`@opencode-ai/sdk`)
- [x] Configure TypeScript type definitions
- [x] Set up development environment and hot reload

### Technical Research

- [x] Research OpenCode SDK API (v2)
- [x] Implement OpenCode local server startup and connection
- [x] Validate streaming responses (SSE event stream)
- [x] Validate file operation capabilities (via Agent tool calls)

---

## Phase 1: MVP Core Features ✅

### 1.1 OpenCode Integration ✅

**Implementation file**: `src/services/opencode-service.ts`

- [x] `initialize()` - Start embedded OpenCode server, configure model, Provider, CORS
- [x] `createSession()` - Create session, bind vault directory
- [x] `sendPrompt()` - Send request + SSE streaming response (content / thinking / tool_use / error)
- [x] `abortSession()` - Abort an ongoing session
- [x] `deleteSession()` - Delete a session
- [x] `destroy()` - Synchronously shut down server (supports onunload)
- [x] Error handling (ApiError, ProviderAuthError, ContextOverflow, etc. categorized handling)
- [x] Port conflict handling (kill residual processes before startup)
- [x] PATH enhancement (fix issue where opencode binary cannot be found in GUI environment)

### 1.2 Settings Page ✅

**Implementation file**: `src/settings.ts`

- [x] OpenCode service URL configuration
- [x] API key (password field)
- [x] Provider ID and Model ID configuration
- [x] Behavior settings (search scope, auto-save, file operation confirmation, history message count)
- [x] Advanced settings (timeout, retry count, streaming response toggle)

### 1.3 Chat Interface ✅

**Implementation file**: `src/views/chat-view.tsx`

- [x] Message list container (supports Markdown rendering)
- [x] Auto-expanding input box
- [x] Send button + Enter shortcut
- [x] Abort button (Stop) with instant UI feedback
- [x] Thinking indicator
- [x] Welcome message
- [x] Error message display
- [x] Streaming response character-by-character rendering
- [x] New session / clear messages operations
- [x] React component refactor (replaces old DOM imperative rendering)

### 1.4 Command Registration ✅

**Implementation file**: `src/main.ts`

- [x] Ribbon icon (message-square)
- [x] `open-chat` - Open chat panel
- [x] `ask-about-note` - Ask about current note
- [x] `summarize-note` - Summarize current note
- [x] Settings page registration

### 1.5 Agent System Prompt ✅

**Implementation file**: `src/services/agent-prompt.ts`

- [x] Vault path awareness (automatically inject absolute path)
- [x] Obsidian native rules (paths, wikilinks, frontmatter, Dataview)
- [x] Tool call guidance (Read/Edit/Bash/Glob/Grep usage specifications)
- [x] WebSearch timing rules
- [x] Knowledge base operation specifications (templates, daily notes, link maintenance)
- [x] Custom prompt extension support

---

## Phase 2: Enhanced Features 🔄

### 2.1 Streaming Response ✅

- [x] Real-time rendering of incremental content text
- [x] Thinking indicator (loading state)
- [x] Streaming error handling (AbortError silently filtered)
- [x] User abort (local + server-side dual interruption)
- [x] Thinking content collapsed display (`details` collapsible block)
- [x] tool_use tool call status rendering (running/completed/error cards + output)

### 2.2 Session Management 🔄

- [x] Session CRUD (create, get, delete, set active)
- [x] Message history management (add, clear)
- [x] Session serialization/deserialization (toJSON/fromJSON)
- [x] New session button
- [x] Clear messages button
- [x] Session sidebar / selector UI (sidebar compact mode, numbered 1/2/3...)
- [x] Fetch and render history messages when switching active session
- [x] Session isolation scoped by vault directory (`session.list` filtered by `directory=<vault_path>`)
- [x] Active session limit control (default 3, configurable in settings)
- [x] Session management and message handling split (`SessionManager` / `ChatService`)
- [x] New session set as active by default
- [ ] **Session persistence to disk** (currently lost on restart, needs plugin.loadData/saveData integration)
- [ ] **Auto-generate session title** (smart naming based on first message)

### 2.3 Slash Commands ✅

- [x] Type `/` to trigger autocomplete
- [x] Fetch and display all available commands (OpenCode `command.list`)
- [x] Input filtering (name / description)
- [x] Keyboard interaction (↑/↓ to select, Enter/Tab to insert, Esc to close)
- [x] Mouse hover and click selection

### 2.4 Context Awareness ⏳

- [ ] Auto-inject current note context (update on open file change)
- [ ] Vault file tree structure awareness
- [ ] `@filename` manual reference syntax (quickly insert note content into conversation)
- [ ] Context scope configuration (current note / current folder / entire vault)

### 2.5 File Operation Visualization ✅

- [x] Parse `tool_use` streaming events (pending / running / completed / error states)
- [x] Inline tool cards in messages (tool name + status icon)
- [x] Operation details expand/collapse
- [x] Operation result feedback (success/failure)

---

## Phase 3: Editor Integration 🔄

### 3.1 Editor Commands 🔄

**Partially implemented** — `ask-about-note` and `summarize-note` are already registered in `main.ts`

- [x] `ask-about-note` - Ask about current note (implemented)
- [x] `summarize-note` - Summarize current note (implemented)
- [ ] `explain-selection` - Explain selected content
- [ ] `improve-writing` - Improve selected content
- [ ] `generate-content` - Generate content at cursor position
- [ ] Commands linked with chat view (results displayed directly in chat panel, partially implemented)

### 3.2 Context Menu ⏳

- [ ] Register editor right-click menu
- [ ] Show AI operations submenu after selecting text
- [ ] Menu item icons and shortcut descriptions

---

## Phase 4: Optimization 🔄

### 4.1 Performance Optimization

- [ ] Message list virtual scrolling (long conversation performance)
- [ ] Debounced input handling
- [ ] Async Markdown rendering (avoid blocking UI)
- [ ] Retry on service initialization failure (currently re-initializes immediately on settings change, may conflict)

### 4.2 Error Handling Improvements

- [ ] Network status detection (display offline/connecting state)
- [ ] User-friendly guidance when service is not ready (currently only Notice prompt)
- [ ] `searchFiles` / `searchText` API alignment fix (currently marked as TODO)
- [ ] Error log persistence

### 4.3 UI/UX Improvements

- [ ] Mobile adaptation (touch targets ≥ 44×44px, responsive layout)
- [ ] Message copy button
- [ ] Message regenerate button
- [ ] One-click copy for code blocks
- [ ] Settings page "Test Connection" button
- [ ] Replace emoji icon buttons (use Obsidian setIcon API)
- [ ] Theme adaptation (ensure correct display in both dark/light modes)

### 4.4 Code Quality

- [ ] Eliminate all `as any` type assertions (after SDK type definitions are complete)
- [ ] Replace `as ChatView` in `getChatView()` with `instanceof` check
- [ ] Security evaluation of `execSync`/`child_process` (consider alternatives)
- [ ] ESLint full pass (eslint-plugin-obsidianmd)

### 4.5 Testing

- [ ] OpencodeService unit tests
- [ ] SessionManager unit tests
- [ ] End-to-end integration tests

---

## Phase 5: Release Preparation ⏳

### 5.1 Code Review

- [ ] Full Obsidian best practices check (against OBSIDIAN_BEST_PRACTICES.md)
- [ ] Security review (API key storage, XSS protection)
- [ ] Dependency review (confirm no unnecessary native node modules)

### 5.2 Compatibility Testing

- [ ] macOS (primary development platform)
- [ ] Windows (path separators, opencode binary lookup)
- [ ] Linux
- [ ] iOS / Android (mobile)
- [ ] Obsidian minimum version compatibility validation

### 5.3 Release

- [ ] Update manifest.json version number
- [ ] Write CHANGELOG
- [ ] Complete README (installation, configuration, usage screenshots)
- [ ] Submit to Obsidian community plugins repository
- [ ] Create GitHub Release

---

## Key Milestones

| Milestone                   | Status               | Deliverables                                                                                           |
| --------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| M1: MVP Complete            | ✅ Done              | Basic conversation, streaming response, settings page                                                  |
| M2: Enhanced Features Done  | 🔄 In Progress (82%) | Multi-session management, tool/thinking visualization, slash commands (remaining: persistence/context) |
| M3: Editor Integration Done | 🔄 In Progress (35%) | Selection operation commands, right-click menu                                                         |
| M4: Optimization Done       | 🔄 In Progress (12%) | Performance, UX, code quality                                                                          |
| M5: Release                 | ⏳ Not Started       | Submit to community plugins                                                                            |

---

## Near-term Priority Tasks (Next Up)

Sorted by priority:

1. **Session persistence** — Integrate `plugin.loadData/saveData`, preserve history across restarts
2. **`explain-selection` / `improve-writing` commands** — Complete the editor command set
3. **Context injection and `@filename` references** — Strengthen context awareness capabilities
4. **Settings page "Test Connection" button** — Improve configuration experience
5. **`searchFiles` / `searchText` API alignment fix** — Eliminate TODO feature gaps
6. **Mobile and responsive adaptation** — Validate sidebar and input experience
7. **Auto-generate session titles** — Improve readability in multi-session scenarios

---

## Known Technical Debt

| Issue                                                                             | Location                                              | Priority             |
| --------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------- |
| `searchFiles` / `searchText` commented out, API type mismatch                     | `opencode-service.ts:690` / `opencode-service.ts:723` | Medium               |
| `getChatView()` uses `as ChatView` type assertion                                 | `main.ts:145`                                         | Low                  |
| `updateSettings()` calling `initialize()` directly may cause concurrency conflict | `opencode-service.ts:755`                             | Medium               |
| `execSync` used in render process                                                 | `opencode-service.ts:118`                             | Low (functional now) |
| `MarkdownRenderer.renderMarkdown` passed `plugin as any`                          | `chat-view.tsx:99`                                    | Low                  |

---

## Risks and Mitigations

| Risk                              | Impact | Probability | Mitigation                                                           |
| --------------------------------- | ------ | ----------- | -------------------------------------------------------------------- |
| OpenCode SDK API changes          | High   | Medium      | Lock SDK version (currently v2), monitor changelog                   |
| opencode binary not in PATH       | High   | Medium      | `findOpencodeExecutable()` already covers common installation paths  |
| Port 4096 conflict                | Medium | Low         | `killPortProcess()` handles this before startup                      |
| Obsidian API compatibility        | High   | Low         | Follow best practices, minimum version set to 1.4.0                  |
| Mobile node.js API unavailability | High   | High        | `execSync`/`child_process` not available on mobile, needs adaptation |
