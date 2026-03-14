import { App, PluginSettingTab } from "obsidian";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import type OnyxMindPlugin from "./main";
import { SettingsPanel } from "./views/settings/SettingsPanel";

export type ProviderId = "openai" | "anthropic" | "kimi" | "openrouter";

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

export const PROVIDER_META: Record<
  ProviderId,
  { name: string; defaultApiBase: string; fixedApiBase: boolean }
> = {
  openai: {
    name: "OpenAI",
    defaultApiBase: "https://api.openai.com/v1",
    fixedApiBase: false,
  },
  anthropic: {
    name: "Anthropic",
    defaultApiBase: "https://api.anthropic.com",
    fixedApiBase: false,
  },
  kimi: {
    name: "Kimi",
    defaultApiBase: "https://api.moonshot.cn/v1",
    fixedApiBase: false,
  },
  openrouter: {
    name: "OpenRouter",
    defaultApiBase: "https://openrouter.ai/api/v1",
    fixedApiBase: true,
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

  // Advanced settings
  timeout: number;
  maxRetries: number;
  streamResponse: boolean;
}

export const DEFAULT_SETTINGS: OnyxMindSettings = {
  opencodeBaseUrl: "http://localhost:4096",
  providers: [
    {
      id: "openai",
      apiKey: "",
      apiBase: "",
      models: [
        { modelId: "gpt-4o", maxTokens: 128000, isReasoning: false },
        { modelId: "gpt-4o-mini", maxTokens: 16000, isReasoning: false },
        { modelId: "o3-mini", maxTokens: 100000, isReasoning: true },
      ],
    },
    {
      id: "anthropic",
      apiKey: "",
      apiBase: "",
      models: [
        { modelId: "claude-opus-4-6", maxTokens: 200000, isReasoning: false },
        {
          modelId: "claude-sonnet-4-6",
          maxTokens: 200000,
          isReasoning: false,
        },
        { modelId: "claude-haiku-4-5", maxTokens: 200000, isReasoning: false },
      ],
    },
    {
      id: "kimi",
      apiKey: "",
      apiBase: "",
      models: [
        {
          modelId: "moonshot-v1-128k",
          maxTokens: 128000,
          isReasoning: false,
        },
        {
          modelId: "kimi-k2-0711-preview",
          maxTokens: 128000,
          isReasoning: false,
        },
      ],
    },
    {
      id: "openrouter",
      apiKey: "",
      apiBase: "",
      models: [
        { modelId: "openai/gpt-4o", maxTokens: 128000, isReasoning: false },
        {
          modelId: "anthropic/claude-sonnet-4-5",
          maxTokens: 200000,
          isReasoning: false,
        },
      ],
    },
  ],
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
