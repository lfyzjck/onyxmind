# OnyxMind Obsidian 插件开发最佳实践

本文档基于 Obsidian 官方 ESLint 插件规则和社区最佳实践，为 OnyxMind 插件开发提供具体指导。

## 1. 命名规范

### 1.1 插件标识和名称

**manifest.json 配置**:
```json
{
  "id": "onyxmind",  // ✅ 不包含 "obsidian"，不以 "plugin" 结尾
  "name": "OnyxMind",  // ✅ 不包含 "Obsidian"，不以 "Plugin" 结尾
  "description": "AI assistant for note querying, content generation, and iterative writing.",  // ✅ 以标点结尾，不包含 "Obsidian" 或 "This plugin"
  "version": "0.1.0",
  "minAppVersion": "0.15.0",
  "author": "Your Name",
  "isDesktopOnly": false
}
```

### 1.2 命令命名

**规则**:
- 使用 sentence case（句子大小写）
- 不包含 "command" 字样
- 不重复插件 ID

```typescript
// ✅ 正确
this.addCommand({
  id: 'open-chat',  // 不包含 "onyxmind-" 前缀
  name: 'Open chat',  // sentence case，不包含 "command"
  callback: () => this.activateView()
});

// ❌ 错误
this.addCommand({
  id: 'onyxmind-open-chat-command',  // 冗余
  name: 'Open Chat Command',  // Title Case，包含 "Command"
  callback: () => this.activateView()
});
```

### 1.3 UI 文本规范

所有 UI 文本使用 sentence case:

```typescript
// ✅ 正确
setting.setName('API key');
setting.setDesc('Enter your OpenCode API key.');
button.setText('Clear history');

// ❌ 错误
setting.setName('API Key');  // Title Case
setting.setDesc('Enter Your OpenCode API Key');
button.setText('Clear History');
```

## 2. 内存管理和生命周期

### 2.1 使用注册方法自动清理

**必须使用的注册方法**:

```typescript
export default class OnyxMindPlugin extends Plugin {
  async onload() {
    // ✅ 使用 registerEvent 自动清理
    this.registerEvent(
      this.app.workspace.on('file-open', (file) => {
        console.log('File opened:', file?.path);
      })
    );

    // ✅ 使用 addCommand 自动清理
    this.addCommand({
      id: 'open-chat',
      name: 'Open chat',
      callback: () => this.activateView()
    });

    // ✅ 使用 registerDomEvent 自动清理
    this.registerDomEvent(document, 'click', (evt) => {
      // 处理点击
    });

    // ✅ 使用 registerInterval 自动清理
    this.registerInterval(
      window.setInterval(() => this.checkConnection(), 60000)
    );
  }

  onunload() {
    // ✅ 不需要手动清理，Obsidian 会自动处理
    // ❌ 不要在这里 detach leaves
  }
}
```

### 2.2 避免存储视图引用

```typescript
// ❌ 错误 - 会导致内存泄漏
export default class OnyxMindPlugin extends Plugin {
  chatView: ChatView;  // 不要存储视图引用

  async onload() {
    this.chatView = new ChatView(this);  // 错误
  }
}

// ✅ 正确 - 按需获取视图
export default class OnyxMindPlugin extends Plugin {
  async onload() {
    this.registerView(
      VIEW_TYPE_CHAT,
      (leaf) => new ChatView(leaf, this)
    );
  }

  getChatView(): ChatView | null {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CHAT);
    if (leaves.length > 0) {
      return leaves[0].view as ChatView;
    }
    return null;
  }
}
```

### 2.3 不要将插件作为组件传递

```typescript
// ❌ 错误
MarkdownRenderer.renderMarkdown(
  content,
  containerEl,
  '',
  this  // 不要传递插件实例
);

// ✅ 正确
MarkdownRenderer.renderMarkdown(
  content,
  containerEl,
  '',
  null  // 或者传递一个专门的 component 对象
);
```

## 3. 类型安全

### 3.1 使用 instanceof 而非类型转换

```typescript
// ✅ 正确
const file = this.app.vault.getAbstractFileByPath(path);
if (file instanceof TFile) {
  const content = await this.app.vault.read(file);
}

// ❌ 错误
const file = this.app.vault.getAbstractFileByPath(path) as TFile;
const content = await this.app.vault.read(file);  // 可能崩溃
```

### 3.2 避免使用 any

```typescript
// ✅ 正确
interface OpencodeResponse {
  type: 'content' | 'tool_use' | 'error';
  text?: string;
  tool?: string;
}

async handleResponse(response: OpencodeResponse) {
  // 类型安全
}

// ❌ 错误
async handleResponse(response: any) {
  // 失去类型检查
}
```

### 3.3 使用 const 和 let

```typescript
// ✅ 正确
const API_ENDPOINT = 'https://api.opencode.ai';
let sessionId: string | null = null;

// ❌ 错误
var API_ENDPOINT = 'https://api.opencode.ai';
var sessionId;
```

## 4. 文件和 Vault 操作

### 4.1 使用正确的 API

```typescript
class OnyxMindPlugin extends Plugin {
  // ✅ 正确 - 使用 Editor API 编辑活动文件
  async insertAtCursor(text: string) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      const editor = view.editor;
      editor.replaceSelection(text);
    }
  }

  // ✅ 正确 - 使用 Vault.process() 后台修改文件
  async updateFileInBackground(file: TFile, updater: (content: string) => string) {
    await this.app.vault.process(file, updater);
  }

  // ❌ 错误 - 不要用 Vault.modify() 编辑活动文件
  async insertAtCursorWrong(text: string) {
    const file = this.app.workspace.getActiveFile();
    if (file) {
      const content = await this.app.vault.read(file);
      await this.app.vault.modify(file, content + text);  // 会丢失光标位置
    }
  }
}
```

### 4.2 路径处理

```typescript
// ✅ 正确 - 使用 normalizePath
import { normalizePath } from 'obsidian';

const userPath = settings.notesFolder;
const normalizedPath = normalizePath(userPath);
const file = this.app.vault.getAbstractFileByPath(normalizedPath);

// ✅ 正确 - 使用 vault.configDir 而非硬编码
const configPath = `${this.app.vault.configDir}/onyxmind-data.json`;

// ❌ 错误 - 硬编码 .obsidian
const configPath = '.obsidian/onyxmind-data.json';
```

### 4.3 文件查找优化

```typescript
// ✅ 正确 - 直接查找
const file = this.app.vault.getAbstractFileByPath('path/to/file.md');

// ❌ 错误 - 遍历整个 vault
const files = this.app.vault.getMarkdownFiles();
const file = files.find(f => f.path === 'path/to/file.md');
```

## 5. UI/UX 最佳实践

### 5.1 设置页面

```typescript
class OnyxMindSettingTab extends PluginSettingTab {
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // ✅ 正确 - 使用 setHeading()
    new Setting(containerEl)
      .setHeading()
      .setName('Connection');  // sentence case，不包含 "settings"

    new Setting(containerEl)
      .setName('API key')  // sentence case
      .setDesc('Enter your OpenCode API key.')
      .addText(text => text
        .setPlaceholder('sk-...')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));

    // ❌ 错误 - 手动创建标题
    containerEl.createEl('h2', { text: 'Connection Settings' });
  }
}
```

### 5.2 不设置默认快捷键

```typescript
// ✅ 正确 - 不设置 hotkeys
this.addCommand({
  id: 'open-chat',
  name: 'Open chat',
  callback: () => this.activateView()
});

// ❌ 错误 - 设置默认快捷键可能冲突
this.addCommand({
  id: 'open-chat',
  name: 'Open chat',
  hotkeys: [{ modifiers: ['Mod'], key: 'o' }],  // 不要这样做
  callback: () => this.activateView()
});
```

## 6. CSS 样式

### 6.1 使用 CSS 变量

```css
/* styles.css */

/* ✅ 正确 - 使用 Obsidian CSS 变量 */
.onyxmind-chat-view {
  background-color: var(--background-primary);
  color: var(--text-normal);
  padding: var(--size-4-4);
  border-radius: var(--radius-m);
  font-size: var(--font-ui-medium);
}

.onyxmind-message-user {
  background-color: var(--background-primary-alt);
  color: var(--text-normal);
}

.onyxmind-message-assistant {
  background-color: var(--background-secondary);
  color: var(--text-normal);
}

.onyxmind-button {
  background-color: var(--interactive-normal);
  color: var(--text-on-accent);
  padding: var(--size-4-2) var(--size-4-4);
  border-radius: var(--radius-s);
}

.onyxmind-button:hover {
  background-color: var(--interactive-hover);
}

/* ❌ 错误 - 硬编码颜色 */
.onyxmind-chat-view {
  background-color: #ffffff;
  color: #000000;
}
```

### 6.2 作用域限定

```css
/* ✅ 正确 - 限定到插件容器 */
.onyxmind-chat-view .message {
  padding: 8px;
}

/* ❌ 错误 - 全局选择器 */
.message {
  padding: 8px;
}
```

### 6.3 不使用内联样式

```typescript
// ✅ 正确 - 使用 CSS 类
const button = containerEl.createEl('button', {
  cls: 'onyxmind-button'
});

// ❌ 错误 - 内联样式
const button = containerEl.createEl('button');
button.style.backgroundColor = '#007bff';
button.style.color = 'white';
```

## 7. 无障碍访问（必需）

### 7.1 键盘导航

```typescript
// ✅ 正确 - 支持键盘操作
const button = containerEl.createEl('button', {
  cls: 'onyxmind-icon-button',
  attr: {
    'aria-label': 'Clear chat history',
    'data-tooltip-position': 'top'
  }
});

button.addEventListener('click', () => this.clearHistory());
button.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    this.clearHistory();
  }
});
```

### 7.2 焦点指示器

```css
/* ✅ 正确 - 使用 :focus-visible */
.onyxmind-button:focus-visible {
  outline: 2px solid var(--interactive-accent);
  outline-offset: 2px;
}

/* ❌ 错误 - 移除焦点指示器 */
.onyxmind-button:focus {
  outline: none;
}
```

### 7.3 触摸目标大小

```css
/* ✅ 正确 - 最小 44x44px */
.onyxmind-icon-button {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 7.4 ARIA 标签

```typescript
// ✅ 正确 - 为图标按钮添加 ARIA 标签
const closeButton = headerEl.createEl('button', {
  cls: 'onyxmind-close-button',
  attr: {
    'aria-label': 'Close chat',
    'data-tooltip-position': 'bottom'
  }
});
closeButton.innerHTML = '×';

// ❌ 错误 - 没有 ARIA 标签的图标按钮
const closeButton = headerEl.createEl('button');
closeButton.innerHTML = '×';
```

## 8. 平台兼容性

### 8.1 使用 Platform API

```typescript
import { Platform } from 'obsidian';

// ✅ 正确
if (Platform.isMobile) {
  // 移动端特定逻辑
}

if (Platform.isIosApp) {
  // iOS 特定逻辑
}

// ❌ 错误
if (navigator.userAgent.includes('Mobile')) {
  // 不可靠
}
```

### 8.2 避免 iOS 不兼容特性

```typescript
// ❌ 错误 - iOS < 16.4 不支持 lookbehind
const regex = /(?<=\[\[).*?(?=\]\])/g;

// ✅ 正确 - 使用兼容的正则
const regex = /\[\[(.*?)\]\]/g;
const match = regex.exec(text);
if (match) {
  const linkText = match[1];
}
```

## 9. 网络请求

### 9.1 使用 requestUrl 而非 fetch

```typescript
import { requestUrl } from 'obsidian';

// ✅ 正确 - 绕过 CORS 限制
async fetchData(url: string) {
  try {
    const response = await requestUrl({
      url: url,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.settings.apiKey}`
      }
    });
    return response.json;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

// ❌ 错误 - fetch 会受 CORS 限制
async fetchData(url: string) {
  const response = await fetch(url);
  return response.json();
}
```

## 10. 代码质量

### 10.1 使用 Obsidian DOM 辅助函数

```typescript
// ✅ 正确
const container = containerEl.createDiv({ cls: 'onyxmind-container' });
const title = container.createEl('h3', { text: 'Chat History' });
const button = container.createEl('button', { text: 'Clear' });

// ❌ 错误
const container = document.createElement('div');
container.className = 'onyxmind-container';
containerEl.appendChild(container);
```

### 10.2 使用 async/await

```typescript
// ✅ 正确
async loadData() {
  try {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// ❌ 错误
loadData() {
  this.loadData()
    .then(data => {
      this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
    })
    .catch(error => {
      console.error('Failed to load settings:', error);
    });
}
```

### 10.3 避免 XSS 风险

```typescript
// ✅ 正确 - 使用 setText 或 Markdown 渲染
messageEl.setText(userInput);
// 或
MarkdownRenderer.renderMarkdown(userInput, messageEl, '', null);

// ❌ 错误 - innerHTML 有 XSS 风险
messageEl.innerHTML = userInput;
```

### 10.4 移除示例代码

```typescript
// ❌ 错误 - 保留示例代码
export default class MyPlugin extends Plugin {
  // ...
}

class SampleModal extends Modal {
  // ...
}

// ✅ 正确 - 使用实际的类名
export default class OnyxMindPlugin extends Plugin {
  // ...
}

class ChatView extends ItemView {
  // ...
}
```

## 11. 日志和调试

### 11.1 生产环境日志

```typescript
// ✅ 正确 - 不在 onload/onunload 中使用 console.log
async onload() {
  await this.loadSettings();
  this.registerView(VIEW_TYPE_CHAT, (leaf) => new ChatView(leaf, this));
  // 不要 console.log
}

// ✅ 正确 - 错误日志可以保留
async sendRequest() {
  try {
    // ...
  } catch (error) {
    console.error('Request failed:', error);  // 错误日志可以
    new Notice('Failed to send request');
  }
}

// ❌ 错误 - 污染控制台
async onload() {
  console.log('Plugin loaded');  // 不要这样做
}
```

## 12. 测试清单

发布前必须检查:

- [ ] 所有命令和 UI 文本使用 sentence case
- [ ] 没有默认快捷键
- [ ] 使用 `registerEvent()` 等注册方法
- [ ] 不存储视图引用
- [ ] 使用 `instanceof` 进行类型检查
- [ ] 所有样式使用 CSS 变量
- [ ] 所有交互元素支持键盘操作
- [ ] 所有图标按钮有 ARIA 标签
- [ ] 焦点指示器清晰可见
- [ ] 触摸目标至少 44x44px
- [ ] 使用 `requestUrl()` 而非 `fetch()`
- [ ] 使用 `Platform` API 检测平台
- [ ] 没有 iOS 不兼容的正则表达式
- [ ] 移除所有示例代码
- [ ] manifest.json 符合命名规范
- [ ] 在移动端测试（如果不是 desktop-only）

## 13. ESLint 配置

安装并配置 ESLint:

```bash
npm install --save-dev eslint-plugin-obsidianmd
```

```javascript
// eslint.config.mjs
import obsidianPlugin from 'eslint-plugin-obsidianmd';

export default [
  {
    plugins: {
      obsidianmd: obsidianPlugin
    },
    rules: {
      ...obsidianPlugin.configs.recommended.rules
    }
  }
];
```

运行检查:
```bash
npm run lint
```

自动修复:
```bash
npm run lint -- --fix
```
