import { Plugin, Notice } from "obsidian";
import {
  DEFAULT_SETTINGS,
  OnyxMindSettings,
  OnyxMindSettingTab,
} from "./settings";
import { OpencodeService } from "./services/opencode-service";
import { SessionManager } from "./services/session-manager";
import { ChatService } from "./services/chat-service";
import { ChatView, VIEW_TYPE_CHAT } from "./views/chat-view";

export default class OnyxMindPlugin extends Plugin {
  settings: OnyxMindSettings;
  opencodeService: OpencodeService;
  sessionManager: SessionManager;
  chatService: ChatService;

  async onload() {
    await this.loadSettings();

    // Initialize services
    this.opencodeService = new OpencodeService(this.app, this.settings);
    this.sessionManager = new SessionManager(
      this.opencodeService,
      () => this.settings.maxActiveSessions,
    );
    this.chatService = new ChatService(this.sessionManager);

    // Initialize OpenCode client
    const initialized = await this.opencodeService.initialize();
    if (!initialized) {
      new Notice("Failed to initialize service. Check settings.");
    }

    // Register chat view
    this.registerView(VIEW_TYPE_CHAT, (leaf) => new ChatView(leaf, this));

    // Add ribbon icon
    this.addRibbonIcon("message-square", "Open chat", () => {
      void this.activateView();
    });

    // Register commands
    this.registerCommands();

    // Add settings tab
    this.addSettingTab(new OnyxMindSettingTab(this.app, this));
  }

  onunload() {
    console.debug("[OnyxMind] Plugin unloading...");
    this.opencodeService.destroy();
  }

  /**
   * Register all commands
   */
  registerCommands() {
    // Open chat
    this.addCommand({
      id: "open-chat",
      name: "Open chat",
      callback: () => {
        void this.activateView();
      },
    });

    // Ask about current note
    this.addCommand({
      id: "ask-about-note",
      name: "Ask about current note",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new Notice("No active file");
          return;
        }

        const content = await this.app.vault.read(file);
        await this.activateView();

        const chatView = this.getChatView();
        if (chatView) {
          await chatView.sendMessage(
            `I have a question about this note:\n\nFile: ${file.path}\n\nContent:\n${content}\n\nWhat can you tell me about it?`,
          );
        }
      },
    });

    // Summarize current note
    this.addCommand({
      id: "summarize-note",
      name: "Summarize current note",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new Notice("No active file");
          return;
        }

        const content = await this.app.vault.read(file);
        await this.activateView();

        const chatView = this.getChatView();
        if (chatView) {
          await chatView.sendMessage(
            `Please summarize this note:\n\n${content}`,
          );
        }
      },
    });
  }

  /**
   * Activate the chat view
   */
  async activateView() {
    const { workspace } = this.app;

    let leaf = workspace.getLeavesOfType(VIEW_TYPE_CHAT)[0];

    if (!leaf) {
      // Create new leaf in right sidebar
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        await rightLeaf.setViewState({
          type: VIEW_TYPE_CHAT,
          active: true,
        });
        leaf = rightLeaf;
      }
    }

    if (leaf) {
      void workspace.revealLeaf(leaf);
    }
  }

  /**
   * Get the chat view (fetched on demand, no reference stored)
   */
  getChatView(): ChatView | null {
    const leaves = this.app.workspace.getLeavesOfType(VIEW_TYPE_CHAT);
    if (leaves.length > 0 && leaves[0]) {
      return leaves[0].view as ChatView;
    }
    return null;
  }

  async loadSettings() {
    const loaded: unknown = await this.loadData();
    const data =
      loaded && typeof loaded === "object"
        ? (loaded as Partial<OnyxMindSettings>)
        : {};
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Update service settings
    if (this.opencodeService) {
      this.opencodeService.updateSettings(this.settings);
    }
  }
}
