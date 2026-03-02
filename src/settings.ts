import { App, PluginSettingTab, Setting } from "obsidian";
import type OnyxMindPlugin from "./main";

export interface OnyxMindSettings {
	// OpenCode connection
	opencodeBaseUrl: string;
	apiKey: string;
	providerId: string;
	modelId: string;

	// Behavior settings
	defaultSearchScope: 'current-folder' | 'vault';
	autoSave: boolean;
	confirmFileOperations: boolean;
	maxHistoryMessages: number;

	// Advanced settings
	timeout: number;
	maxRetries: number;
	streamResponse: boolean;
}

export const DEFAULT_SETTINGS: OnyxMindSettings = {
	// OpenCode connection
	opencodeBaseUrl: 'http://localhost:4096',
	apiKey: '',
	providerId: 'kimi-for-coding',
	modelId: 'kimi-for-coding/k2p5',

	// Behavior settings
	defaultSearchScope: 'vault',
	autoSave: true,
	confirmFileOperations: false,
	maxHistoryMessages: 50,

	// Advanced settings
	timeout: 30000,
	maxRetries: 3,
	streamResponse: true
};

export class OnyxMindSettingTab extends PluginSettingTab {
	plugin: OnyxMindPlugin;

	constructor(app: App, plugin: OnyxMindPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		// Connection settings
		new Setting(containerEl)
			.setHeading()
			.setName('Connection');

		new Setting(containerEl)
			.setName('OpenCode service URL')
			.setDesc('Base URL for the OpenCode service.')
			.addText(text => text
				.setPlaceholder('http://localhost:8080')
				.setValue(this.plugin.settings.opencodeBaseUrl)
				.onChange(async (value) => {
					this.plugin.settings.opencodeBaseUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('API key')
			.setDesc('Your Anthropic API key for Claude models.')
			.addText(text => {
				text
					.setPlaceholder('sk-ant-...')
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value;
						await this.plugin.saveSettings();
					});
				// Make it a password field
				text.inputEl.type = 'password';
				return text;
			});

		new Setting(containerEl)
			.setName('Provider ID')
			.setDesc('AI provider identifier (e.g., kimi-for-coding, anthropic).')
			.addText(text => text
				.setPlaceholder('kimi-for-coding')
				.setValue(this.plugin.settings.providerId)
				.onChange(async (value) => {
					this.plugin.settings.providerId = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Model')
			.setDesc('Model identifier to use.')
			.addText(text => text
				.setPlaceholder('kimi-for-coding/k2p5')
				.setValue(this.plugin.settings.modelId)
				.onChange(async (value) => {
					this.plugin.settings.modelId = value;
					await this.plugin.saveSettings();
				}));

		// Behavior settings
		new Setting(containerEl)
			.setHeading()
			.setName('Behavior');

		new Setting(containerEl)
			.setName('Default search scope')
			.setDesc('Where to search for notes by default.')
			.addDropdown(dropdown => dropdown
				.addOption('vault', 'Entire vault')
				.addOption('current-folder', 'Current folder')
				.setValue(this.plugin.settings.defaultSearchScope)
				.onChange(async (value: 'vault' | 'current-folder') => {
					this.plugin.settings.defaultSearchScope = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto-save conversations')
			.setDesc('Automatically save conversation history.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoSave)
				.onChange(async (value) => {
					this.plugin.settings.autoSave = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Confirm file operations')
			.setDesc('Ask for confirmation before AI modifies files.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.confirmFileOperations)
				.onChange(async (value) => {
					this.plugin.settings.confirmFileOperations = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Maximum history messages')
			.setDesc('Maximum number of messages to keep in history.')
			.addText(text => text
				.setPlaceholder('50')
				.setValue(String(this.plugin.settings.maxHistoryMessages))
				.onChange(async (value) => {
					const num = parseInt(value);
					if (!isNaN(num) && num > 0) {
						this.plugin.settings.maxHistoryMessages = num;
						await this.plugin.saveSettings();
					}
				}));

		// Advanced settings
		new Setting(containerEl)
			.setHeading()
			.setName('Advanced');

		new Setting(containerEl)
			.setName('Request timeout')
			.setDesc('Timeout for API requests in milliseconds.')
			.addText(text => text
				.setPlaceholder('30000')
				.setValue(String(this.plugin.settings.timeout))
				.onChange(async (value) => {
					const num = parseInt(value);
					if (!isNaN(num) && num > 0) {
						this.plugin.settings.timeout = num;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Maximum retries')
			.setDesc('Maximum number of retry attempts for failed requests.')
			.addText(text => text
				.setPlaceholder('3')
				.setValue(String(this.plugin.settings.maxRetries))
				.onChange(async (value) => {
					const num = parseInt(value);
					if (!isNaN(num) && num >= 0) {
						this.plugin.settings.maxRetries = num;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('Stream responses')
			.setDesc('Show AI responses in real-time as they are generated.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.streamResponse)
				.onChange(async (value) => {
					this.plugin.settings.streamResponse = value;
					await this.plugin.saveSettings();
				}));
	}
}
