import { App, PluginSettingTab } from "obsidian";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import type OnyxMindPlugin from "./main";
import { SettingsPanel } from "./views/settings/SettingsPanel";

export type ProviderId =
  | "openai"
  | "anthropic"
  | "kimi"
  | "kimi-for-coding"
  | "openrouter";

export interface ModelConfig {
  modelId: string;
  maxTokens: number;
  isReasoning: boolean;
}

export interface ProviderConfig {
  id: ProviderId;
  apiKey: string;
  apiBase: string;
  models: ModelConfig[];
}

export interface PermissionConfig {
  // Whether agent can write without asking (yolo mode)
  writeMode: "ask" | "allow";
  // Allow delete operations (independent of writeMode)
  allowDelete: boolean;
  // Whitelist: restrict agent to these paths only (empty = no restriction)
  allowedPaths: string[];
  // Blacklist: agent will never modify/delete notes in these paths
  protectedPaths: string[];
  // Respect "protected: true" in note frontmatter
  respectFrontmatterProtection: boolean;
}

export const PROVIDER_META: Record<
  ProviderId,
  {
    name: string;
    defaultApiBase: string;
    fixedApiBase: boolean;
    defaultModels: ModelConfig[];
  }
> = {
  openai: {
    name: "OpenAI",
    defaultApiBase: "https://api.openai.com/v1",
    fixedApiBase: false,
    defaultModels: [
      { modelId: "gpt-4o", maxTokens: 128000, isReasoning: false },
      { modelId: "gpt-4o-mini", maxTokens: 16000, isReasoning: false },
      { modelId: "o3-mini", maxTokens: 100000, isReasoning: true },
    ],
  },
  anthropic: {
    name: "Anthropic",
    defaultApiBase: "https://api.anthropic.com",
    fixedApiBase: false,
    defaultModels: [
      { modelId: "claude-opus-4-6", maxTokens: 200000, isReasoning: false },
      { modelId: "claude-sonnet-4-6", maxTokens: 200000, isReasoning: false },
      { modelId: "claude-haiku-4-5", maxTokens: 200000, isReasoning: false },
    ],
  },
  kimi: {
    name: "Kimi",
    defaultApiBase: "https://api.moonshot.cn/v1",
    fixedApiBase: false,
    defaultModels: [
      { modelId: "moonshot-v1-128k", maxTokens: 128000, isReasoning: false },
      {
        modelId: "kimi-k2-0711-preview",
        maxTokens: 128000,
        isReasoning: false,
      },
    ],
  },
  "kimi-for-coding": {
    name: "Kimi for Coding",
    defaultApiBase: "https://api.kimi.com/coding/",
    fixedApiBase: true,
    defaultModels: [
      { modelId: "k2p5", maxTokens: 256000, isReasoning: true },
      { modelId: "kimi-k2-thinking", maxTokens: 256000, isReasoning: true },
    ],
  },
  openrouter: {
    name: "OpenRouter",
    defaultApiBase: "https://openrouter.ai/api/v1",
    fixedApiBase: true,
    defaultModels: [
      { modelId: "openai/gpt-4o", maxTokens: 128000, isReasoning: false },
      {
        modelId: "anthropic/claude-sonnet-4-5",
        maxTokens: 200000,
        isReasoning: false,
      },
    ],
  },
};

export interface OnyxMindSettings {
  // OpenCode connection
  opencodeBaseUrl: string;

  // Provider configuration
  providers: ProviderConfig[];
  activeProviderId: ProviderId;
  activeModelId: string;

  // Behavior settings
  defaultSearchScope: "current-folder" | "vault";
  autoSave: boolean;
  maxActiveSessions: number;
  confirmFileOperations: boolean;
  maxHistoryMessages: number;
  showToolCallsAfterStreaming: boolean;

  // Permission settings
  permissions: PermissionConfig;

  // Advanced settings
  timeout: number;
  maxRetries: number;
  streamResponse: boolean;
}

export function isProviderConfigured(provider: ProviderConfig): boolean {
  return provider.apiKey.trim().length > 0 && provider.models.length > 0;
}

export function getConfiguredProviders(
  providers: ProviderConfig[],
): ProviderConfig[] {
  return providers.filter(isProviderConfigured);
}

export const DEFAULT_SETTINGS: OnyxMindSettings = {
  opencodeBaseUrl: "http://localhost:4096",
  providers: (Object.keys(PROVIDER_META) as ProviderId[]).map((id) => ({
    id,
    apiKey: "",
    apiBase: "",
    models: PROVIDER_META[id].defaultModels,
  })),
  activeProviderId: "kimi",
  activeModelId: "kimi-k2-0711-preview",

  // Behavior settings
  defaultSearchScope: "vault",
  autoSave: true,
  maxActiveSessions: 3,
  confirmFileOperations: false,
  maxHistoryMessages: 50,
  showToolCallsAfterStreaming: true,

  // Advanced settings
  timeout: 30000,
  maxRetries: 3,
  streamResponse: true,

  // Permission settings
  permissions: {
    writeMode: "allow",
    allowDelete: false,
    allowedPaths: [],
    protectedPaths: [],
    respectFrontmatterProtection: false,
  },
};

export class OnyxMindSettingTab extends PluginSettingTab {
  plugin: OnyxMindPlugin;
  private root: Root | null = null;

  constructor(app: App, plugin: OnyxMindPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const mount = containerEl.createDiv("onyxmind-settings-panel-mount");
    this.root = createRoot(mount);
    this.root.render(
      React.createElement(SettingsPanel, { plugin: this.plugin }),
    );
  }

  hide(): void {
    this.root?.unmount();
    this.root = null;
  }
}
