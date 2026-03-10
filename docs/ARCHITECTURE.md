# OnyxMind Technical Architecture Design

## 1. Architecture Overview

### 1.1 Overall Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Obsidian App                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              OnyxMind Plugin                      │  │
│  │  ┌─────────────┐  ┌──────────────┐              │  │
│  │  │  UI Layer   │  │ Service Layer│              │  │
│  │  │             │  │               │              │  │
│  │  │ - ChatView  │──│ - OpenCode   │              │  │
│  │  │ - Commands  │  │   Client     │              │  │
│  │  │ - Settings  │  │ - Session    │              │  │
│  │  │             │  │   Manager    │              │  │
│  │  └─────────────┘  └──────┬───────┘              │  │
│  │                           │                       │  │
│  └───────────────────────────┼───────────────────────┘  │
└────────────────────────────┼─────────────────────────┘
                              │ OpenCode SDK
                              │ (@opencode-ai/sdk)
                              ▼
                    ┌──────────────────┐
                    │  OpenCode Server │
                    │                  │
                    │  - AI Agent      │
                    │  - File Ops      │
                    │  - LLM Provider  │
                    └──────────────────┘
```

### 1.2 Design Principles

- **Separation of concerns**: The plugin is responsible only for UI and request forwarding; all business logic is handled by the OpenCode Agent
- **Minimal intrusion**: Does not modify Obsidian core functionality; integrates via API
- **Async-first**: All network requests and file operations are executed asynchronously
- **Error resilience**: Comprehensive error handling and user feedback

## 2. Technology Stack

### 2.1 Core Dependencies

- **Obsidian API**: Plugin base framework
- **@opencode-ai/sdk**: OpenCode client SDK
- **TypeScript**: Type-safe development language
- **esbuild**: Fast build tool

### 2.2 Optional Dependencies

- **marked**: Markdown rendering (for custom rendering if needed)
- **highlight.js**: Code highlighting
- **date-fns**: Date and time utilities

## 3. Module Design

### 3.1 Plugin Main Class (OnyxMindPlugin)

**Responsibility**: Plugin lifecycle management and module coordination

```typescript
export default class OnyxMindPlugin extends Plugin {
  settings: OnyxMindSettings;
  opencodeService: OpencodeService;
  sessionManager: SessionManager;
  // ⚠️ Do not store view references here — causes memory leaks

  async onload(): Promise<void>;
  async onunload(): Promise<void>;
  async loadSettings(): Promise<void>;
  async saveSettings(): Promise<void>;

  // Get view on demand
  getChatView(): ChatView | null;
  async activateView(): Promise<void>;
}
```

**Key methods**:

- `onload()`: Initialize services, register commands and views, use registerEvent/addCommand for automatic cleanup
- `onunload()`: Automatic cleanup (no need to manually detach leaves)
- `loadSettings()`: Load user configuration
- `saveSettings()`: Save user configuration
- `getChatView()`: Get view instance on demand (do not store reference)
- `activateView()`: Activate or create the chat view

**Obsidian best practices**:

- ✅ Use `registerEvent()` to register event listeners
- ✅ Use `addCommand()` to register commands
- ✅ Use `registerView()` to register custom views
- ✅ Use `registerDomEvent()` to register DOM events
- ✅ Use `registerInterval()` to register timers
- ❌ Do not store view references in plugin properties
- ❌ Do not manually detach leaves in onunload

### 3.2 OpenCode Client Service (OpencodeService)

**Responsibility**: Wraps the OpenCode SDK and provides a unified API call interface

```typescript
class OpencodeService {
  private client: OpencodeClient;
  private config: OpencodeConfig;

  async initialize(config: OpencodeConfig): Promise<void>;
  async createSession(): Promise<string>;
  async sendPrompt(
    sessionId: string,
    prompt: PromptRequest,
  ): Promise<AsyncIterator<PromptResponse>>;
  async searchFiles(query: string): Promise<FileMatch[]>;
  async readFile(path: string): Promise<string>;
  async getSessionHistory(sessionId: string): Promise<Message[]>;
  async closeSession(sessionId: string): Promise<void>;
}
```

**Core functionality**:

- Manage OpenCode client connections
- Handle authentication and configuration
- Provide streaming response support
- Error handling and retry logic

### 3.3 Session Manager (SessionManager)

**Responsibility**: Manage the lifecycle of conversation sessions

```typescript
class SessionManager {
  private sessions: Map<string, Session>;
  private activeSessionId: string | null;

  async createSession(): Promise<Session>;
  getSession(id: string): Session | undefined;
  getActiveSession(): Session | null;
  setActiveSession(id: string): void;
  async deleteSession(id: string): Promise<void>;
  getAllSessions(): Session[];
}

interface Session {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}
```

### 3.4 Chat View (ChatView)

**Responsibility**: Render the conversation interface and handle user interactions

```typescript
export const VIEW_TYPE_CHAT = "onyxmind-chat-view";

class ChatView extends ItemView {
  private plugin: OnyxMindPlugin;
  private containerEl: HTMLElement;
  private inputEl: HTMLTextAreaElement;
  private messagesEl: HTMLElement;

  constructor(leaf: WorkspaceLeaf, plugin: OnyxMindPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_CHAT;
  }

  getDisplayText(): string {
    return "OnyxMind chat"; // sentence case
  }

  getIcon(): string {
    return "message-square";
  }

  async onOpen(): Promise<void>;
  async onClose(): Promise<void>;

  private renderMessage(message: Message): void;
  private handleSubmit(text: string): Promise<void>;
  private handleStreamResponse(
    stream: AsyncIterator<PromptResponse>,
  ): Promise<void>;
  private showThinking(show: boolean): void;
  private scrollToBottom(): void;
}
```

**UI component structure**:

```
ChatView
├── Header
│   ├── Title
│   ├── SessionSelector
│   └── Actions (New, Clear, Settings)
├── MessageList
│   ├── UserMessage
│   ├── AssistantMessage
│   │   ├── Content (Markdown)
│   │   ├── FileOperations (expandable)
│   │   └── Actions (Copy, Regenerate)
│   └── ThinkingIndicator
└── InputArea
    ├── TextArea (auto-expand)
    ├── AttachButton (future feature)
    └── SendButton
```

**Obsidian best practices**:

- ✅ Use Obsidian DOM helper methods (createDiv, createSpan, createEl)
- ✅ Use MarkdownRenderer.renderMarkdown() to render Markdown
- ✅ Do not pass plugin as a component to MarkdownRenderer
- ✅ All text uses sentence case
- ✅ Use CSS variables instead of hardcoded styles
- ✅ Ensure keyboard accessibility (all interactive elements)
- ✅ Add aria-label to icon buttons
- ✅ Use :focus-visible to define focus styles

### 3.5 Command Manager (CommandManager)

**Responsibility**: Register and manage Obsidian commands

```typescript
class CommandManager {
  private plugin: OnyxMindPlugin;

  registerCommands(): void;

  private registerChatCommands(): void;
  private registerEditorCommands(): void;
  private registerQuickActions(): void;
}
```

**Command list**:

- `open-chat`: Open chat // ✅ sentence case, does not include "command"
- `ask-about-note`: Ask about current note
- `generate-content`: Generate content
- `improve-writing`: Improve writing
- `summarize`: Summarize note
- `explain-selection`: Explain selected text

**Obsidian best practices**:

- ✅ Command IDs do not include the plugin ID prefix (Obsidian automatically namespaces them)
- ✅ Command names use sentence case
- ✅ Do not include the word "command"
- ❌ Do not set default keyboard shortcuts (to avoid conflicts)

### 3.6 Settings Management (SettingsTab)

**Responsibility**: Provide the configuration interface

```typescript
class OnyxMindSettingTab extends PluginSettingTab {
  plugin: OnyxMindPlugin;

  display(): void;

  private displayConnectionSettings(): void;
  private displayBehaviorSettings(): void;
  private displayUISettings(): void;
  private displayAdvancedSettings(): void;
}

interface OnyxMindSettings {
  // OpenCode connection
  opencodeHost: string;
  opencodePort: number;
  apiKey: string;
  modelId: string;

  // Behavior settings
  defaultSearchScope: "current-folder" | "vault";
  autoSave: boolean;
  confirmFileOperations: boolean;
  maxHistoryMessages: number;

  // UI settings
  sidebarPosition: "left" | "right";
  fontSize: number;
  showThinkingProcess: boolean;

  // Advanced settings
  timeout: number;
  maxRetries: number;
  streamResponse: boolean;
}
```

**Obsidian best practices**:

- ✅ Use `.setHeading()` to create headings (do not manually create HTML)
- ✅ Headings use sentence case
- ✅ Headings do not include "General", "settings", or the plugin name
- ✅ All setting names and descriptions use sentence case
- ✅ Descriptions end with punctuation

## 4. Data Flow Design

### 4.1 User Query Flow

```
User Input
    ↓
ChatView.handleSubmit()
    ↓
SessionManager.getActiveSession()
    ↓
OpencodeService.sendPrompt()
    ↓
OpenCode SDK → OpenCode Server
    ↓
Stream Response ← OpenCode Server
    ↓
ChatView.handleStreamResponse()
    ↓
Render Message (Markdown + File Ops)
    ↓
Update Session History
```

### 4.2 File Operation Flow

```
AI Agent Decision (in OpenCode)
    ↓
File Operation Request
    ↓
OpenCode SDK → Plugin (via stream)
    ↓
ChatView shows operation status
    ↓
Operation Complete
    ↓
Obsidian Vault Updated
    ↓
User sees result in UI
```

### 4.3 Session Management Flow

```
Create Session
    ↓
SessionManager.createSession()
    ↓
OpencodeService.createSession()
    ↓
Store Session Metadata
    ↓
Set as Active Session
    ↓
User Interaction
    ↓
Auto-save Messages
    ↓
Close/Delete Session (optional)
```

## 5. Key Technical Implementations

### 5.0 Obsidian Integration Points

#### 5.0.1 Plugin Initialization Pattern

```typescript
export default class OnyxMindPlugin extends Plugin {
  settings: OnyxMindSettings;
  opencodeService: OpencodeService;
  sessionManager: SessionManager;

  async onload() {
    await this.loadSettings();

    // Initialize services
    this.opencodeService = new OpencodeService(this.app, this.settings);
    this.sessionManager = new SessionManager(this.opencodeService);

    // Register view (do not store reference)
    this.registerView(VIEW_TYPE_CHAT, (leaf) => new ChatView(leaf, this));

    // Add Ribbon icon
    this.addRibbonIcon("message-square", "OnyxMind", () => {
      this.activateView();
    });

    // Register commands (automatic cleanup)
    this.addCommand({
      id: "open-chat",
      name: "Open chat", // sentence case
      callback: () => this.activateView(),
    });

    // Register events (automatic cleanup)
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        // Handle file open event
      }),
    );

    // Add settings tab
    this.addSettingTab(new OnyxMindSettingTab(this.app, this));
  }

  onunload() {
    // Obsidian handles cleanup automatically, no manual action needed
  }

  // Get view on demand
  getChatView(): ChatView | null {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CHAT);
    return leaves.length > 0 ? (leaves[0].view as ChatView) : null;
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_CHAT)[0];

    if (!leaf) {
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: VIEW_TYPE_CHAT, active: true });
    }

    workspace.revealLeaf(leaf);
  }
}
```

#### 5.0.2 Type-Safe File Operations

```typescript
// ✅ Correct - use instanceof
async getFileContent(path: string): Promise<string | null> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
        return await this.app.vault.read(file);
    }
    return null;
}

// ✅ Correct - use Editor API to edit the active file
async insertAtCursor(text: string) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
        view.editor.replaceSelection(text);
    }
}

// ✅ Correct - use Vault.process() for background modification
async updateFile(file: TFile, updater: (content: string) => string) {
    await this.app.vault.process(file, updater);
}
```

#### 5.0.3 Use requestUrl Instead of fetch

```typescript
import { requestUrl } from 'obsidian';

// ✅ Correct - bypass CORS restrictions
async makeRequest(url: string, data: any) {
    const response = await requestUrl({
        url: url,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return response.json;
}
```

#### 5.0.4 Platform Detection

```typescript
import { Platform } from "obsidian";

// ✅ Correct - use Platform API
if (Platform.isMobile) {
  // Handle mobile platform
}

if (Platform.isIosApp) {
  // iOS-specific handling (avoid incompatible regular expressions)
}
```

### 5.1 Streaming Response Handling

```typescript
async handleStreamResponse(stream: AsyncIterator<PromptResponse>): Promise<void> {
    const messageEl = this.createMessageElement('assistant');
    const contentEl = messageEl.querySelector('.message-content');

    let fullContent = '';

    for await (const chunk of stream) {
        if (chunk.type === 'content') {
            fullContent += chunk.text;
            // ⚠️ Do not pass plugin as a component
            MarkdownRenderer.renderMarkdown(
                fullContent,
                contentEl,
                '',
                null  // Pass null instead of this.plugin
            );
        } else if (chunk.type === 'file_operation') {
            // Show file operation status
            this.showFileOperation(messageEl, chunk.operation);
        } else if (chunk.type === 'error') {
            this.showError(messageEl, chunk.error);
        }
    }

    this.scrollToBottom();
}
```

### 5.2 Vault Context Injection

```typescript
async injectVaultContext(sessionId: string): Promise<void> {
    const vault = this.plugin.app.vault;
    const files = vault.getMarkdownFiles();

    // Build file tree structure
    const fileTree = this.buildFileTree(files);

    // Inject context using noReply
    await this.opencodeService.sendPrompt(sessionId, {
        parts: [{
            type: 'text',
            text: `Vault structure:\n${JSON.stringify(fileTree, null, 2)}`
        }],
        noReply: true
    });
}
```

### 5.3 Error Handling Strategy

```typescript
async sendPromptWithRetry(
    sessionId: string,
    prompt: PromptRequest,
    maxRetries: number = 3
): Promise<AsyncIterator<PromptResponse>> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await this.opencodeService.sendPrompt(sessionId, prompt);
        } catch (error) {
            lastError = error;

            if (error.code === 'NETWORK_ERROR') {
                // Network error — wait and retry
                await this.delay(1000 * Math.pow(2, i));
                continue;
            } else if (error.code === 'AUTH_ERROR') {
                // Authentication error — prompt user to reconfigure
                new Notice('OpenCode authentication failed. Please check your API key.');
                throw error;
            } else {
                // Other errors — rethrow immediately
                throw error;
            }
        }
    }

    throw lastError;
}
```

## 6. Performance Optimization

### 6.1 Lazy Loading

- Chat view created on demand
- Session history loaded with pagination
- Large file content transferred in chunks

### 6.2 Caching Strategy

- Session metadata cached in memory
- File tree structure cached (listening for vault changes)
- OpenCode client connection reused

### 6.3 UI Optimization

- Virtual scrolling (for long conversation histories)
- Debounced input handling
- Asynchronous Markdown rendering

## 7. Security Considerations

### 7.1 Data Security

- API key encrypted storage (using Obsidian's data encryption)
- Sensitive information not logged
- Supports local OpenCode deployment

### 7.2 File Operation Security

- Optional operation confirmation mechanism
- File operation audit logging
- Supports operation undo (using Obsidian's history)

### 7.3 Network Security

- HTTPS connections
- Request timeout control
- XSS attack prevention (Markdown rendering)

## 8. Testing Strategy

### 8.1 Unit Testing

- OpencodeService method tests
- SessionManager logic tests
- Utility function tests

### 8.2 Integration Testing

- OpenCode SDK integration tests
- Obsidian API integration tests
- End-to-end flow tests

### 8.3 Manual Testing

- Cross-platform compatibility testing
- Performance stress testing
- User experience testing

## 9. Deployment and Release

### 9.1 Build Process

```bash
npm run build
# Generates main.js, manifest.json, styles.css
```

### 9.2 Release Checklist

- [ ] Version number updated
- [ ] CHANGELOG updated
- [ ] Documentation complete
- [ ] Tests passing
- [ ] Code review done
- [ ] Community plugin submission

### 9.3 Version Roadmap

- **v0.1.0**: MVP release (basic conversation features)
- **v0.2.0**: Enhanced release (streaming responses, file operation visualization)
- **v0.3.0**: Full release (all P1 features)
- **v1.0.0**: Stable release (thoroughly tested)

## 10. Future Extensions

### 10.1 Short-term Plans

- Support for custom Agent configuration
- Multi-language interface
- Inter-plugin collaboration (integration with other Obsidian plugins)

### 10.2 Long-term Plans

- Local LLM support
- Collaboration features (multi-user)
- Advanced analytics and insights
- Native mobile experience optimization
