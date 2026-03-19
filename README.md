# OnyxMind

<div align="center">

**An AI-powered assistant for Obsidian, built on the OpenCode Agent framework**

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/lfyzjck/onyxmind)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Obsidian](https://img.shields.io/badge/Obsidian-0.15.0+-purple.svg)](https://obsidian.md)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Development](#development) • [Contributing](#contributing)

</div>

---

## Overview

OnyxMind is an intelligent assistant plugin for Obsidian that brings powerful AI capabilities directly into your note-taking workflow. Built on the [OpenCode Agent framework](https://opencode.ai), it enables natural language interactions with your knowledge base, content generation, iterative writing assistance, and intelligent note management.

### Key Highlights

- 🤖 **AI-Powered Conversations** - Chat with AI models directly in Obsidian
- 📝 **Note-Aware Context** - Automatically understands your current note and vault structure
- 🎯 **Smart Capabilities** - Pre-configured prompts for common tasks (metadata completion, note review, quizzes, Zen mode)
- 🛠️ **Tool Visualization** - See AI tool calls and file operations in real-time
- 💬 **Multi-Session Management** - Organize conversations with automatic summarization
- ⌨️ **Keyboard-First** - Full keyboard navigation and slash commands support
- 🎨 **Theme-Adaptive** - Seamlessly integrates with Obsidian's theming system

---

## Features

### Core Functionality

#### 🗨️ Intelligent Chat Interface

- **Streaming responses** with real-time content generation
- **Thinking process visualization** to understand AI reasoning
- **Tool call tracking** with detailed input/output display
- **Markdown rendering** with syntax highlighting
- **Error handling** with user-friendly messages

#### 📚 Session Management

- **Multiple concurrent sessions** with configurable limits
- **Automatic session summarization** after first conversation
- **Session title display** on hover for easy identification
- **Session persistence** across Obsidian restarts
- **Quick session switching** with keyboard shortcuts

#### 🎯 Welcome Capabilities

Pre-configured AI capabilities for common workflows:

- **Complete Note Metadata** - Auto-generate tags, properties, and backlinks
- **Review Notes** - Check content completeness and logical structure
- **Quiz Mode** - Generate interactive quizzes from note content
- **Zen Mode** - Deep thinking prompts for exploration and insight

#### ⚡ Slash Commands

- **Command autocomplete** with fuzzy search
- **Keyboard navigation** (Arrow keys, Enter, Tab, Escape)
- **MCP and Skill integration** for extended functionality
- **Custom command support** (coming soon)

#### 📎 Note Context Integration

- **Current note injection** - Automatically includes active note in first message
- **Removable context chip** - Control when note context is sent
- **File link handling** - Click to navigate to referenced files
- **Vault-scoped operations** - All AI actions respect vault boundaries

### User Experience

#### 🎨 Modern UI/UX

- **Theme-adaptive styling** using Obsidian CSS variables
- **Responsive layout** for desktop and mobile
- **Accessibility support** with ARIA labels and keyboard navigation
- **Focus management** with visible focus indicators
- **Smooth animations** and transitions

#### ⌨️ Keyboard Shortcuts

- `Enter` - Send message
- `Shift + Enter` - New line in input
- `Cmd/Ctrl + P` - Open command palette
- `/` - Trigger slash command menu
- `↑/↓` - Navigate slash commands
- `Esc` - Close slash menu

---

## Installation

### Prerequisites

- **Obsidian** v1.12.3 or higher
- **OpenCode CLI** installed and configured ([Installation Guide](https://opencode.ai/docs/installation))

### Method 1: Manual Installation (Recommended for Testing)

1. **Download the latest release**

   Go to the [Releases page](https://github.com/lfyzjck/onyxmind/releases) and download the following files from the latest release:
   - `main.js`
   - `manifest.json`
   - `styles.css`

2. **Copy to Obsidian plugins folder**

   Create the plugin directory and place the downloaded files inside:

   ```
   <vault>/.obsidian/plugins/onyxmind/main.js
   <vault>/.obsidian/plugins/onyxmind/manifest.json
   <vault>/.obsidian/plugins/onyxmind/styles.css
   ```

3. **Enable in Obsidian**
   - Open Obsidian Settings
   - Navigate to **Community plugins**
   - Disable **Safe mode** (if enabled)
   - Click **Reload plugins**
   - Enable **OnyxMind**

### Method 2: Community Plugin (Coming Soon)

Once published to the Obsidian Community Plugin directory:

1. Open Obsidian Settings
2. Go to **Community plugins** → **Browse**
3. Search for "OnyxMind"
4. Click **Install** → **Enable**

---

## Configuration

### Initial Setup

1. **Open Plugin Settings**
   - Go to **Settings** → **OnyxMind**

2. **Configure AI Provider**
   - **Provider ID**: `anthropic` (default)
   - **Model ID**: `claude-3-5-sonnet-20241022` (recommended)
   - **API Key**: Your Anthropic API key ([Get one here](https://console.anthropic.com/))

3. **Adjust Behavior Settings** (optional)
   - **Max Active Sessions**: Maximum concurrent chat sessions (default: 3)
   - **Max History Messages**: Number of messages to load from history (default: 50)

### OpenCode Configuration

OnyxMind automatically starts an OpenCode server on `http://127.0.0.1:4096`. The server configuration includes:

- **Web Search**: Enabled via Exa integration
- **Skills**: Obsidian-specific skills loaded from community repository
- **Agent Prompt**: Custom system prompt for Obsidian context awareness

---

## Usage

### Basic Chat

1. **Open Chat View**
   - Click the 💬 icon in the left ribbon, or
   - Run command: `OnyxMind: Open chat`

2. **Start Conversation**
   - Type your message in the input box
   - Press `Enter` to send (or click Send button)
   - Watch the AI response stream in real-time

3. **Use Welcome Capabilities**
   - Click any capability card on the welcome screen
   - Pre-configured prompts will be sent automatically

### Working with Notes

#### Ask About Current Note

```
1. Open a note in Obsidian
2. Run command: "OnyxMind: Ask about current note"
3. The note content is automatically included in context
```

#### Summarize Current Note

```
1. Open a note
2. Run command: "OnyxMind: Summarize current note"
3. Receive a concise summary
```

### Advanced Features

#### Slash Commands

Type `/` in the chat input to see available commands:

- `/commit` - Git commit assistance
- `/review-pr` - Pull request review
- Custom commands from MCP servers and skills

#### Question Interactions

When AI asks questions:

1. Answer options appear in the chat
2. Select your answer(s)
3. Click Submit to continue conversation

#### Session Management

- **New Session**: Click `+` button in session strip
- **Switch Session**: Click session number tab
- **Close Session**: Click `×` on session tab
- **Clear Messages**: Click trash icon in header
- **Refresh**: Click refresh icon to sync with server

---

## Development

### Project Structure

```
onyxmind/
├── src/
│   ├── main.ts                    # Plugin entry point
│   ├── settings.ts                # Settings interface
│   ├── services/
│   │   ├── opencode-service.ts    # OpenCode SDK wrapper
│   │   ├── session-manager.ts     # Session state management
│   │   └── chat-service.ts        # Chat logic and streaming
│   ├── views/
│   │   ├── chat-view.tsx          # Main chat view
│   │   └── chat/
│   │       ├── chat-view-app.tsx  # React root component
│   │       ├── components/        # UI components
│   │       ├── hooks/             # React hooks
│   │       └── welcome-capabilities.ts
│   └── utils/
│       ├── opencode-server.ts     # Server lifecycle
│       └── env.ts                 # Environment helpers
├── styles.css                     # Plugin styles
├── manifest.json                  # Plugin metadata
└── tests/                         # Test files
```

### Building from Source

```bash
# Install dependencies
npm install

# Development mode (watch)
npm run dev

# Production build
npm run build

# Lint code
npm run lint

# Format code
npm run format
```

### Development Workflow

1. **Make changes** to TypeScript files in `src/`
2. **Build** with `npm run dev` (auto-rebuilds on save)
3. **Reload** plugin in Obsidian (Cmd/Ctrl + R in dev console)
4. **Test** your changes
5. **Commit** with descriptive messages

### Testing

```bash
# Run unit tests
npm test

# Test specific file
node tests/session-manager.test.js

# Test OpenCode SDK integration
node tests/sdk-test-standalone.js
```

### Code Quality

- **TypeScript** with strict mode enabled
- **ESLint** with Obsidian-specific rules
- **Prettier** for consistent formatting
- **Pre-commit hooks** for automatic linting and formatting

---

## Architecture

### Core Principles

1. **Separation of Concerns**
   - Plugin acts as UI layer only
   - All AI processing handled by OpenCode Agent
   - Clean service boundaries

2. **Obsidian Best Practices**
   - Memory-safe event registration
   - Type-safe API usage
   - Accessibility-first design
   - Mobile compatibility

3. **Performance**
   - Streaming responses for perceived speed
   - Efficient message rendering
   - Lazy loading of history
   - Debounced user input

### Key Components

#### OpencodeService

- Manages OpenCode server lifecycle
- Wraps SDK client with custom fetch (CORS workaround)
- Handles session CRUD operations
- Streams AI responses via SSE

#### SessionManager

- Maintains session state in memory
- Persists sessions to Obsidian data
- Enforces session limits
- Syncs with remote OpenCode sessions

#### ChatService

- Orchestrates message flow
- Manages streaming state
- Handles tool calls and questions
- Provides abort functionality

#### ChatView

- React-based UI components
- Hooks for state management
- Markdown rendering with syntax highlighting
- Tool visualization components

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for detailed development plans.

### v0.2.0 (Planned: March 2026)

- [ ] Enhanced file operations visualization
- [ ] Conversation history search
- [ ] Note integration improvements
- [ ] Performance optimizations

### v0.3.0 (Planned: April 2026)

- [ ] Multi-modal support (images, attachments)
- [ ] Custom command system
- [ ] Collaboration features
- [ ] Mobile optimizations

### v1.0.0 (Planned: May 2026)

- [ ] Stable API
- [ ] Complete feature set
- [ ] Comprehensive documentation
- [ ] Community plugin release

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Ways to Contribute

- 🐛 **Report bugs** via GitHub Issues
- 💡 **Suggest features** in Discussions
- 📝 **Improve documentation**
- 🔧 **Submit pull requests**
- 🌍 **Translate** to other languages

### Development Guidelines

1. **Follow Obsidian best practices** ([OBSIDIAN_BEST_PRACTICES.md](OBSIDIAN_BEST_PRACTICES.md))
2. **Write tests** for new features
3. **Update documentation** for user-facing changes
4. **Use conventional commits** for clear history
5. **Ensure accessibility** in all UI changes

---

## Troubleshooting

### Common Issues

#### Plugin doesn't load

- Ensure `main.js`, `manifest.json`, and `styles.css` are in the plugin folder
- Check Obsidian console (Cmd/Ctrl + Shift + I) for errors
- Try rebuilding: `npm run build`

#### "Failed to initialize OpenCode"

- Verify OpenCode CLI is installed: `opencode --version`
- Check if port 4096 is available
- Review console logs for detailed error messages

#### CORS errors

- This should be automatically handled by the plugin
- If issues persist, ensure you're using the latest version
- See [MEMORY.md](.claude/projects/-Users-jiachengkun-projects-onyxmind/memory/MEMORY.md) for technical details

#### No AI responses

- Verify API key is configured correctly
- Check network connectivity
- Ensure OpenCode server is running (check console logs)
- Try creating a new session

#### Styling issues

- Reload Obsidian
- Try switching themes
- Check if `styles.css` is loaded in dev console

For more help, see [USER_GUIDE.md](USER_GUIDE.md) or open an issue.

---

## Privacy & Security

### Data Handling

- **Local-first**: All data stored locally in your vault
- **No telemetry**: No usage tracking or analytics
- **API calls**: Only to configured AI provider (Anthropic)
- **Vault isolation**: Plugin only accesses files within your vault

### What Gets Sent to AI

- User messages and conversation history
- Current note content (when explicitly requested)
- File paths and metadata (for context)
- Tool call results

### What Never Gets Sent

- Vault structure or file list (unless explicitly requested)
- Personal information (unless included in notes)
- Plugin settings or API keys
- Usage statistics

### Security Best Practices

- Store API keys securely (Obsidian encrypts plugin data)
- Review AI responses before accepting file modifications
- Use vault backups regularly
- Keep plugin updated for security patches

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- **OpenCode Team** - For the excellent AI agent framework
- **Obsidian Team** - For the amazing note-taking platform
- **Anthropic** - For Claude AI models
- **Community Contributors** - For feedback and contributions

---

## Links

- **Documentation**: [Full docs](https://github.com/lfyzjck/onyxmind/wiki)
- **Issues**: [Bug reports](https://github.com/lfyzjck/onyxmind/issues)
- **Discussions**: [Community forum](https://github.com/lfyzjck/onyxmind/discussions)
- **OpenCode**: [opencode.ai](https://opencode.ai)
- **Obsidian**: [obsidian.md](https://obsidian.md)

---

<div align="center">

**Made with ❤️ for the Obsidian community**

[⭐ Star on GitHub](https://github.com/lfyzjck/onyxmind) • [📖 Read the Docs](https://github.com/lfyzjck/onyxmind/wiki) • [💬 Join Discussion](https://github.com/lfyzjck/onyxmind/discussions)

</div>
