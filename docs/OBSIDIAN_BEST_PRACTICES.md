# OnyxMind Obsidian Plugin Development Best Practices

This document is based on the official Obsidian ESLint plugin rules and community best practices, providing concrete guidance for OnyxMind plugin development.

## 1. Naming Conventions

### 1.1 Plugin ID and Name

**manifest.json configuration**:

```json
{
  "id": "onyxmind", // ✅ Does not contain "obsidian", does not end with "plugin"
  "name": "OnyxMind", // ✅ Does not contain "Obsidian", does not end with "Plugin"
  "description": "AI assistant for note querying, content generation, and iterative writing.", // ✅ Ends with punctuation, does not contain "Obsidian" or "This plugin"
  "version": "0.1.0",
  "minAppVersion": "0.15.0",
  "author": "Your Name",
  "isDesktopOnly": false
}
```

### 1.2 Command Naming

**Rules**:

- Use sentence case
- Do not include the word "command"
- Do not repeat the plugin ID

```typescript
// ✅ Correct
this.addCommand({
  id: "open-chat", // Does not include the "onyxmind-" prefix
  name: "Open chat", // Sentence case, does not include "command"
  callback: () => this.activateView(),
});

// ❌ Incorrect
this.addCommand({
  id: "onyxmind-open-chat-command", // Redundant
  name: "Open Chat Command", // Title Case, contains "Command"
  callback: () => this.activateView(),
});
```

### 1.3 UI Text Conventions

All UI text uses sentence case:

```typescript
// ✅ Correct
setting.setName("API key");
setting.setDesc("Enter your OpenCode API key.");
button.setText("Clear history");

// ❌ Incorrect
setting.setName("API Key"); // Title Case
setting.setDesc("Enter Your OpenCode API Key");
button.setText("Clear History");
```

## 2. Memory Management and Lifecycle

### 2.1 Use Registration Methods for Automatic Cleanup

**Required registration methods**:

```typescript
export default class OnyxMindPlugin extends Plugin {
  async onload() {
    // ✅ Use registerEvent for automatic cleanup
    this.registerEvent(
      this.app.workspace.on("file-open", (file) => {
        console.log("File opened:", file?.path);
      }),
    );

    // ✅ Use addCommand for automatic cleanup
    this.addCommand({
      id: "open-chat",
      name: "Open chat",
      callback: () => this.activateView(),
    });

    // ✅ Use registerDomEvent for automatic cleanup
    this.registerDomEvent(document, "click", (evt) => {
      // Handle click
    });

    // ✅ Use registerInterval for automatic cleanup
    this.registerInterval(
      window.setInterval(() => this.checkConnection(), 60000),
    );
  }

  onunload() {
    // ✅ No manual cleanup needed; Obsidian handles it automatically
    // ❌ Do not detach leaves here
  }
}
```

### 2.2 Avoid Storing View References

```typescript
// ❌ Incorrect - causes memory leaks
export default class OnyxMindPlugin extends Plugin {
  chatView: ChatView; // Do not store view references

  async onload() {
    this.chatView = new ChatView(this); // Incorrect
  }
}

// ✅ Correct - retrieve the view on demand
export default class OnyxMindPlugin extends Plugin {
  async onload() {
    this.registerView(VIEW_TYPE_CHAT, (leaf) => new ChatView(leaf, this));
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

### 2.3 Do Not Pass the Plugin as a Component

```typescript
// ❌ Incorrect
MarkdownRenderer.renderMarkdown(
  content,
  containerEl,
  "",
  this, // Do not pass the plugin instance
);

// ✅ Correct
MarkdownRenderer.renderMarkdown(
  content,
  containerEl,
  "",
  null, // Or pass a dedicated component object
);
```

## 3. Type Safety

### 3.1 Use instanceof Instead of Type Casting

```typescript
// ✅ Correct
const file = this.app.vault.getAbstractFileByPath(path);
if (file instanceof TFile) {
  const content = await this.app.vault.read(file);
}

// ❌ Incorrect
const file = this.app.vault.getAbstractFileByPath(path) as TFile;
const content = await this.app.vault.read(file); // May crash
```

### 3.2 Avoid Using any

```typescript
// ✅ Correct
interface OpencodeResponse {
  type: 'content' | 'tool_use' | 'error';
  text?: string;
  tool?: string;
}

async handleResponse(response: OpencodeResponse) {
  // Type-safe
}

// ❌ Incorrect
async handleResponse(response: any) {
  // Loses type checking
}
```

### 3.3 Use const and let

```typescript
// ✅ Correct
const API_ENDPOINT = "https://api.opencode.ai";
let sessionId: string | null = null;

// ❌ Incorrect
var API_ENDPOINT = "https://api.opencode.ai";
var sessionId;
```

## 4. File and Vault Operations

### 4.1 Use the Correct API

```typescript
class OnyxMindPlugin extends Plugin {
  // ✅ Correct - use the Editor API to edit the active file
  async insertAtCursor(text: string) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      const editor = view.editor;
      editor.replaceSelection(text);
    }
  }

  // ✅ Correct - use Vault.process() to modify files in the background
  async updateFileInBackground(
    file: TFile,
    updater: (content: string) => string,
  ) {
    await this.app.vault.process(file, updater);
  }

  // ❌ Incorrect - do not use Vault.modify() to edit the active file
  async insertAtCursorWrong(text: string) {
    const file = this.app.workspace.getActiveFile();
    if (file) {
      const content = await this.app.vault.read(file);
      await this.app.vault.modify(file, content + text); // Will lose cursor position
    }
  }
}
```

### 4.2 Path Handling

```typescript
// ✅ Correct - use normalizePath
import { normalizePath } from "obsidian";

const userPath = settings.notesFolder;
const normalizedPath = normalizePath(userPath);
const file = this.app.vault.getAbstractFileByPath(normalizedPath);

// ✅ Correct - use vault.configDir instead of hardcoding
const configPath = `${this.app.vault.configDir}/onyxmind-data.json`;

// ❌ Incorrect - hardcoded .obsidian
const configPath = ".obsidian/onyxmind-data.json";
```

### 4.3 File Lookup Optimization

```typescript
// ✅ Correct - direct lookup
const file = this.app.vault.getAbstractFileByPath("path/to/file.md");

// ❌ Incorrect - iterating the entire vault
const files = this.app.vault.getMarkdownFiles();
const file = files.find((f) => f.path === "path/to/file.md");
```

## 5. UI/UX Best Practices

### 5.1 Settings Page

```typescript
class OnyxMindSettingTab extends PluginSettingTab {
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // ✅ Correct - use setHeading()
    new Setting(containerEl).setHeading().setName("Connection"); // Sentence case, does not include "settings"

    new Setting(containerEl)
      .setName("API key") // Sentence case
      .setDesc("Enter your OpenCode API key.")
      .addText((text) =>
        text
          .setPlaceholder("sk-...")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          }),
      );

    // ❌ Incorrect - manually creating a heading
    containerEl.createEl("h2", { text: "Connection Settings" });
  }
}
```

### 5.2 Do Not Set Default Hotkeys

```typescript
// ✅ Correct - do not set hotkeys
this.addCommand({
  id: "open-chat",
  name: "Open chat",
  callback: () => this.activateView(),
});

// ❌ Incorrect - setting default hotkeys may cause conflicts
this.addCommand({
  id: "open-chat",
  name: "Open chat",
  hotkeys: [{ modifiers: ["Mod"], key: "o" }], // Do not do this
  callback: () => this.activateView(),
});
```

## 6. CSS Styles

### 6.1 Use CSS Variables

```css
/* styles.css */

/* ✅ Correct - use Obsidian CSS variables */
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

/* ❌ Incorrect - hardcoded colors */
.onyxmind-chat-view {
  background-color: #ffffff;
  color: #000000;
}
```

### 6.2 Scoped Selectors

```css
/* ✅ Correct - scoped to the plugin container */
.onyxmind-chat-view .message {
  padding: 8px;
}

/* ❌ Incorrect - global selector */
.message {
  padding: 8px;
}
```

### 6.3 Do Not Use Inline Styles

```typescript
// ✅ Correct - use CSS classes
const button = containerEl.createEl("button", {
  cls: "onyxmind-button",
});

// ❌ Incorrect - inline styles
const button = containerEl.createEl("button");
button.style.backgroundColor = "#007bff";
button.style.color = "white";
```

## 7. Accessibility (Required)

### 7.1 Keyboard Navigation

```typescript
// ✅ Correct - support keyboard interaction
const button = containerEl.createEl("button", {
  cls: "onyxmind-icon-button",
  attr: {
    "aria-label": "Clear chat history",
    "data-tooltip-position": "top",
  },
});

button.addEventListener("click", () => this.clearHistory());
button.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    this.clearHistory();
  }
});
```

### 7.2 Focus Indicators

```css
/* ✅ Correct - use :focus-visible */
.onyxmind-button:focus-visible {
  outline: 2px solid var(--interactive-accent);
  outline-offset: 2px;
}

/* ❌ Incorrect - removes the focus indicator */
.onyxmind-button:focus {
  outline: none;
}
```

### 7.3 Touch Target Size

```css
/* ✅ Correct - minimum 44x44px */
.onyxmind-icon-button {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 7.4 ARIA Labels

```typescript
// ✅ Correct - add ARIA labels to icon buttons
const closeButton = headerEl.createEl("button", {
  cls: "onyxmind-close-button",
  attr: {
    "aria-label": "Close chat",
    "data-tooltip-position": "bottom",
  },
});
closeButton.innerHTML = "×";

// ❌ Incorrect - icon button without an ARIA label
const closeButton = headerEl.createEl("button");
closeButton.innerHTML = "×";
```

## 8. Platform Compatibility

### 8.1 Use the Platform API

```typescript
import { Platform } from "obsidian";

// ✅ Correct
if (Platform.isMobile) {
  // Mobile-specific logic
}

if (Platform.isIosApp) {
  // iOS-specific logic
}

// ❌ Incorrect
if (navigator.userAgent.includes("Mobile")) {
  // Unreliable
}
```

### 8.2 Avoid iOS-Incompatible Features

```typescript
// ❌ Incorrect - lookbehind not supported on iOS < 16.4
const regex = /(?<=\[\[).*?(?=\]\])/g;

// ✅ Correct - use a compatible regex
const regex = /\[\[(.*?)\]\]/g;
const match = regex.exec(text);
if (match) {
  const linkText = match[1];
}
```

## 9. Network Requests

### 9.1 Use requestUrl Instead of fetch

```typescript
import { requestUrl } from 'obsidian';

// ✅ Correct - bypasses CORS restrictions
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

// ❌ Incorrect - fetch is subject to CORS restrictions
async fetchData(url: string) {
  const response = await fetch(url);
  return response.json();
}
```

## 10. Code Quality

### 10.1 Use Obsidian DOM Helper Functions

```typescript
// ✅ Correct
const container = containerEl.createDiv({ cls: "onyxmind-container" });
const title = container.createEl("h3", { text: "Chat History" });
const button = container.createEl("button", { text: "Clear" });

// ❌ Incorrect
const container = document.createElement("div");
container.className = "onyxmind-container";
containerEl.appendChild(container);
```

### 10.2 Use async/await

```typescript
// ✅ Correct
async loadData() {
  try {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// ❌ Incorrect
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

### 10.3 Avoid XSS Risks

```typescript
// ✅ Correct - use setText or Markdown rendering
messageEl.setText(userInput);
// or
MarkdownRenderer.renderMarkdown(userInput, messageEl, "", null);

// ❌ Incorrect - innerHTML carries XSS risk
messageEl.innerHTML = userInput;
```

### 10.4 Remove Sample Code

```typescript
// ❌ Incorrect - leaving sample code in place
export default class MyPlugin extends Plugin {
  // ...
}

class SampleModal extends Modal {
  // ...
}

// ✅ Correct - use the actual class names
export default class OnyxMindPlugin extends Plugin {
  // ...
}

class ChatView extends ItemView {
  // ...
}
```

## 11. Logging and Debugging

### 11.1 Production Logging

```typescript
// ✅ Correct - do not use console.log in onload/onunload
async onload() {
  await this.loadSettings();
  this.registerView(VIEW_TYPE_CHAT, (leaf) => new ChatView(leaf, this));
  // No console.log
}

// ✅ Correct - error logs are acceptable
async sendRequest() {
  try {
    // ...
  } catch (error) {
    console.error('Request failed:', error);  // Error logging is fine
    new Notice('Failed to send request');
  }
}

// ❌ Incorrect - pollutes the console
async onload() {
  console.log('Plugin loaded');  // Do not do this
}
```

## 12. Pre-release Checklist

Must verify before publishing:

- [ ] All commands and UI text use sentence case
- [ ] No default hotkeys
- [ ] Use `registerEvent()` and other registration methods
- [ ] Do not store view references
- [ ] Use `instanceof` for type checking
- [ ] All styles use CSS variables
- [ ] All interactive elements support keyboard operation
- [ ] All icon buttons have ARIA labels
- [ ] Focus indicators are clearly visible
- [ ] Touch targets are at least 44x44px
- [ ] Use `requestUrl()` instead of `fetch()`
- [ ] Use the `Platform` API for platform detection
- [ ] No iOS-incompatible regular expressions
- [ ] Remove all sample code
- [ ] manifest.json follows the naming conventions
- [ ] Tested on mobile (if not desktop-only)

## 13. ESLint Configuration

Install and configure ESLint:

```bash
npm install --save-dev eslint-plugin-obsidianmd
```

```javascript
// eslint.config.mjs
import obsidianPlugin from "eslint-plugin-obsidianmd";

export default [
  {
    plugins: {
      obsidianmd: obsidianPlugin,
    },
    rules: {
      ...obsidianPlugin.configs.recommended.rules,
    },
  },
];
```

Run checks:

```bash
npm run lint
```

Auto-fix:

```bash
npm run lint -- --fix
```
