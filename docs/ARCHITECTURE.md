# OnyxMind 技术架构设计

## 1. 架构概述

### 1.1 整体架构

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

### 1.2 设计原则

- **职责分离**：插件仅负责 UI 和请求转发，所有业务逻辑由 OpenCode Agent 处理
- **最小侵入**：不修改 Obsidian 核心功能，通过 API 集成
- **异步优先**：所有网络请求和文件操作异步执行
- **错误容错**：完善的错误处理和用户提示

## 2. 技术栈

### 2.1 核心依赖

- **Obsidian API**：插件基础框架
- **@opencode-ai/sdk**：OpenCode 客户端 SDK
- **TypeScript**：类型安全的开发语言
- **esbuild**：快速构建工具

### 2.2 可选依赖

- **marked**：Markdown 渲染（如需自定义渲染）
- **highlight.js**：代码高亮
- **date-fns**：时间处理

## 3. 模块设计

### 3.1 插件主类 (OnyxMindPlugin)

**职责**：插件生命周期管理和模块协调

```typescript
export default class OnyxMindPlugin extends Plugin {
  settings: OnyxMindSettings;
  opencodeService: OpencodeService;
  sessionManager: SessionManager;
  // ⚠️ 不要存储视图引用，会导致内存泄漏

  async onload(): Promise<void>;
  async onunload(): Promise<void>;
  async loadSettings(): Promise<void>;
  async saveSettings(): Promise<void>;

  // 按需获取视图
  getChatView(): ChatView | null;
  async activateView(): Promise<void>;
}
```

**关键方法**：

- `onload()`: 初始化服务、注册命令和视图、使用 registerEvent/addCommand 自动清理
- `onunload()`: 自动清理（不需要手动 detach leaves）
- `loadSettings()`: 加载用户配置
- `saveSettings()`: 保存用户配置
- `getChatView()`: 按需获取视图实例（不存储引用）
- `activateView()`: 激活或创建聊天视图

**Obsidian 最佳实践**：

- ✅ 使用 `registerEvent()` 注册事件监听器
- ✅ 使用 `addCommand()` 注册命令
- ✅ 使用 `registerView()` 注册自定义视图
- ✅ 使用 `registerDomEvent()` 注册 DOM 事件
- ✅ 使用 `registerInterval()` 注册定时器
- ❌ 不要存储视图引用在插件属性中
- ❌ 不要在 onunload 中手动 detach leaves

### 3.2 OpenCode 客户端服务 (OpencodeService)

**职责**：封装 OpenCode SDK，提供统一的 API 调用接口

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

**核心功能**：

- 管理 OpenCode 客户端连接
- 处理认证和配置
- 提供流式响应支持
- 错误处理和重试逻辑

### 3.3 会话管理器 (SessionManager)

**职责**：管理对话会话的生命周期

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

### 3.4 聊天视图 (ChatView)

**职责**：渲染对话界面，处理用户交互

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

**UI 组件结构**：

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
│   │   ├── FileOperations (可展开)
│   │   └── Actions (Copy, Regenerate)
│   └── ThinkingIndicator
└── InputArea
    ├── TextArea (自动扩展)
    ├── AttachButton (未来功能)
    └── SendButton
```

**Obsidian 最佳实践**：

- ✅ 使用 Obsidian DOM 辅助方法（createDiv, createSpan, createEl）
- ✅ 使用 MarkdownRenderer.renderMarkdown() 渲染 Markdown
- ✅ 不要将 plugin 作为 component 传递给 MarkdownRenderer
- ✅ 所有文本使用 sentence case
- ✅ 使用 CSS 变量而非硬编码样式
- ✅ 确保键盘可访问性（所有交互元素）
- ✅ 为图标按钮添加 aria-label
- ✅ 使用 :focus-visible 定义焦点样式

### 3.5 命令管理器 (CommandManager)

**职责**：注册和管理 Obsidian 命令

```typescript
class CommandManager {
  private plugin: OnyxMindPlugin;

  registerCommands(): void;

  private registerChatCommands(): void;
  private registerEditorCommands(): void;
  private registerQuickActions(): void;
}
```

**命令列表**：

- `open-chat`: Open chat // ✅ sentence case，不包含 "command"
- `ask-about-note`: Ask about current note
- `generate-content`: Generate content
- `improve-writing`: Improve writing
- `summarize`: Summarize note
- `explain-selection`: Explain selected text

**Obsidian 最佳实践**：

- ✅ 命令 ID 不包含插件 ID 前缀（Obsidian 自动添加命名空间）
- ✅ 命令名称使用 sentence case
- ✅ 不包含 "command" 字样
- ❌ 不设置默认快捷键（避免冲突）

### 3.6 设置管理 (SettingsTab)

**职责**：提供配置界面

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
  // OpenCode 连接
  opencodeHost: string;
  opencodePort: number;
  apiKey: string;
  modelId: string;

  // 行为设置
  defaultSearchScope: "current-folder" | "vault";
  autoSave: boolean;
  confirmFileOperations: boolean;
  maxHistoryMessages: number;

  // UI 设置
  sidebarPosition: "left" | "right";
  fontSize: number;
  showThinkingProcess: boolean;

  // 高级设置
  timeout: number;
  maxRetries: number;
  streamResponse: boolean;
}
```

**Obsidian 最佳实践**：

- ✅ 使用 `.setHeading()` 创建标题（不手动创建 HTML）
- ✅ 标题使用 sentence case
- ✅ 标题不包含 "General"、"settings" 或插件名称
- ✅ 所有设置项名称和描述使用 sentence case
- ✅ 描述以标点符号结尾

## 4. 数据流设计

### 4.1 用户提问流程

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

### 4.2 文件操作流程

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

### 4.3 会话管理流程

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

## 5. 关键技术实现

### 5.0 Obsidian 集成要点

#### 5.0.1 插件初始化模式

```typescript
export default class OnyxMindPlugin extends Plugin {
  settings: OnyxMindSettings;
  opencodeService: OpencodeService;
  sessionManager: SessionManager;

  async onload() {
    await this.loadSettings();

    // 初始化服务
    this.opencodeService = new OpencodeService(this.app, this.settings);
    this.sessionManager = new SessionManager(this.opencodeService);

    // 注册视图（不存储引用）
    this.registerView(VIEW_TYPE_CHAT, (leaf) => new ChatView(leaf, this));

    // 添加 Ribbon 图标
    this.addRibbonIcon("message-square", "OnyxMind", () => {
      this.activateView();
    });

    // 注册命令（自动清理）
    this.addCommand({
      id: "open-chat",
      name: "Open chat", // sentence case
      callback: () => this.activateView(),
    });

    // 注册事件（自动清理）
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        // 处理文件打开事件
      }),
    );

    // 添加设置页面
    this.addSettingTab(new OnyxMindSettingTab(this.app, this));
  }

  onunload() {
    // Obsidian 自动清理，不需要手动操作
  }

  // 按需获取视图
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

#### 5.0.2 类型安全的文件操作

```typescript
// ✅ 正确 - 使用 instanceof
async getFileContent(path: string): Promise<string | null> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
        return await this.app.vault.read(file);
    }
    return null;
}

// ✅ 正确 - 使用 Editor API 编辑活动文件
async insertAtCursor(text: string) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
        view.editor.replaceSelection(text);
    }
}

// ✅ 正确 - 使用 Vault.process() 后台修改
async updateFile(file: TFile, updater: (content: string) => string) {
    await this.app.vault.process(file, updater);
}
```

#### 5.0.3 使用 requestUrl 而非 fetch

```typescript
import { requestUrl } from 'obsidian';

// ✅ 正确 - 绕过 CORS 限制
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

#### 5.0.4 平台检测

```typescript
import { Platform } from "obsidian";

// ✅ 正确 - 使用 Platform API
if (Platform.isMobile) {
  // 移动端处理
}

if (Platform.isIosApp) {
  // iOS 特殊处理（避免不兼容的正则表达式）
}
```

### 5.1 流式响应处理

```typescript
async handleStreamResponse(stream: AsyncIterator<PromptResponse>): Promise<void> {
    const messageEl = this.createMessageElement('assistant');
    const contentEl = messageEl.querySelector('.message-content');

    let fullContent = '';

    for await (const chunk of stream) {
        if (chunk.type === 'content') {
            fullContent += chunk.text;
            // ⚠️ 不要将 plugin 作为 component 传递
            MarkdownRenderer.renderMarkdown(
                fullContent,
                contentEl,
                '',
                null  // 传递 null 而非 this.plugin
            );
        } else if (chunk.type === 'file_operation') {
            // 显示文件操作状态
            this.showFileOperation(messageEl, chunk.operation);
        } else if (chunk.type === 'error') {
            this.showError(messageEl, chunk.error);
        }
    }

    this.scrollToBottom();
}
```

### 5.2 Vault 上下文注入

```typescript
async injectVaultContext(sessionId: string): Promise<void> {
    const vault = this.plugin.app.vault;
    const files = vault.getMarkdownFiles();

    // 构建文件树结构
    const fileTree = this.buildFileTree(files);

    // 使用 noReply 注入上下文
    await this.opencodeService.sendPrompt(sessionId, {
        parts: [{
            type: 'text',
            text: `Vault structure:\n${JSON.stringify(fileTree, null, 2)}`
        }],
        noReply: true
    });
}
```

### 5.3 错误处理策略

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
                // 网络错误，等待后重试
                await this.delay(1000 * Math.pow(2, i));
                continue;
            } else if (error.code === 'AUTH_ERROR') {
                // 认证错误，提示用户重新配置
                new Notice('OpenCode authentication failed. Please check your API key.');
                throw error;
            } else {
                // 其他错误，直接抛出
                throw error;
            }
        }
    }

    throw lastError;
}
```

## 6. 性能优化

### 6.1 懒加载

- 聊天视图按需创建
- 会话历史分页加载
- 大文件内容分块传输

### 6.2 缓存策略

- 会话元数据内存缓存
- 文件树结构缓存（监听 vault 变化）
- OpenCode 客户端连接复用

### 6.3 UI 优化

- 虚拟滚动（长对话历史）
- 防抖输入处理
- 异步渲染 Markdown

## 7. 安全考虑

### 7.1 数据安全

- API 密钥加密存储（使用 Obsidian 的数据加密）
- 敏感信息不记录日志
- 支持本地 OpenCode 部署

### 7.2 文件操作安全

- 可选的操作确认机制
- 文件操作日志记录
- 支持操作撤销（利用 Obsidian 的历史记录）

### 7.3 网络安全

- HTTPS 连接
- 请求超时控制
- 防止 XSS 攻击（Markdown 渲染）

## 8. 测试策略

### 8.1 单元测试

- OpencodeService 方法测试
- SessionManager 逻辑测试
- 工具函数测试

### 8.2 集成测试

- OpenCode SDK 集成测试
- Obsidian API 集成测试
- 端到端流程测试

### 8.3 手动测试

- 多平台兼容性测试
- 性能压力测试
- 用户体验测试

## 9. 部署和发布

### 9.1 构建流程

```bash
npm run build
# 生成 main.js, manifest.json, styles.css
```

### 9.2 发布检查清单

- [ ] 版本号更新
- [ ] CHANGELOG 更新
- [ ] 文档完善
- [ ] 测试通过
- [ ] 代码审查
- [ ] 社区插件提交

### 9.3 版本规划

- **v0.1.0**: MVP 版本（基础对话功能）
- **v0.2.0**: 增强版（流式响应、文件操作可视化）
- **v0.3.0**: 完整版（所有 P1 功能）
- **v1.0.0**: 稳定版（经过充分测试）

## 10. 未来扩展

### 10.1 短期规划

- 支持自定义 Agent 配置
- 多语言界面
- 插件间协作（与其他 Obsidian 插件集成）

### 10.2 长期规划

- 本地 LLM 支持
- 协作功能（多用户）
- 高级分析和洞察
- 移动端原生体验优化
