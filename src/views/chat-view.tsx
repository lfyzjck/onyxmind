/**
 * Chat View
 * React-based chat interface for OnyxMind.
 */

import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { createRoot, type Root } from 'react-dom/client';
import type OnyxMindPlugin from '../main';
import { ChatViewApp } from './chat/chat-view-app';
import type { ChatViewActions } from './chat/types';

export const VIEW_TYPE_CHAT = 'onyxmind-chat-view';

export class ChatView extends ItemView {
	private plugin: OnyxMindPlugin;
	private reactRoot: Root | null = null;
	private actions: ChatViewActions | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: OnyxMindPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_CHAT;
	}

	getDisplayText(): string {
		return 'OnyxMind chat';
	}

	getIcon(): string {
		return 'message-square';
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		if (!container) {
			return;
		}

		container.empty();
		const mountEl = (container as HTMLElement).createDiv('onyxmind-react-root');

		this.reactRoot = createRoot(mountEl);
		this.reactRoot.render(
			<ChatViewApp
				plugin={this.plugin}
				onReady={(actions) => {
					this.actions = actions;
				}}
			/>
		);
	}

	async onClose(): Promise<void> {
		this.actions = null;
		this.reactRoot?.unmount();
		this.reactRoot = null;
	}

	async sendMessage(text: string): Promise<void> {
		if (!this.actions) {
			new Notice('Chat view is not ready');
			return;
		}
		await this.actions.sendMessage(text);
	}
}
