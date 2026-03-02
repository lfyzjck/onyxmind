/**
 * Chat View
 * Main chat interface for OnyxMind
 */

import { ItemView, WorkspaceLeaf, MarkdownRenderer } from 'obsidian';
import type OnyxMindPlugin from '../main';
import type { Message, StreamChunkToolUse } from '../services/opencode-service';

export const VIEW_TYPE_CHAT = 'onyxmind-chat-view';

// ── Tool icon mapping ──────────────────────────────────────────────────────
const TOOL_ICONS: Record<string, string> = {
	bash: '$', read: '→', write: '←', edit: '←',
	glob: '✱', grep: '✱', task: '#', question: '?',
	webfetch: '%', websearch: '◈',
};

function toolIcon(name: string): string {
	return TOOL_ICONS[name] ?? '⚙';
}

export class ChatView extends ItemView {
	private plugin: OnyxMindPlugin;
	private messagesContainer: HTMLElement;
	private inputContainer: HTMLElement;
	private inputEl: HTMLTextAreaElement;
	private sendButton: HTMLElement;
	private abortButton: HTMLElement;
	private thinkingIndicator: HTMLElement;
	private streamAbortController: AbortController | null = null;
	private isStreaming = false;
	private isComposing = false;

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
		if (!container) return;

		container.empty();
		container.addClass('onyxmind-chat-container');

		// Create header
		this.createHeader(container as HTMLElement);

		// Create messages container
		this.messagesContainer = (container as HTMLElement).createDiv('onyxmind-messages');

		// Create thinking indicator
		this.thinkingIndicator = this.messagesContainer.createDiv('onyxmind-thinking');
		this.thinkingIndicator.style.display = 'none';
		this.thinkingIndicator.createSpan({ text: 'Thinking...' });

		// Create input container
		this.inputContainer = (container as HTMLElement).createDiv('onyxmind-input-container');
		this.createInputArea();

		// Show welcome message
		this.showWelcomeMessage();
	}

	async onClose(): Promise<void> {
		this.streamAbortController?.abort();
		this.streamAbortController = null;
	}

	/**
	 * Create header with session controls
	 */
	private createHeader(container: HTMLElement): void {
		const header = container.createDiv('onyxmind-header');

		// Title
		const title = header.createDiv('onyxmind-title');
		title.createSpan({ text: 'OnyxMind' });

		// Actions
		const actions = header.createDiv('onyxmind-actions');

		// New session button
		const newButton = actions.createEl('button', {
			cls: 'onyxmind-button',
			attr: {
				'aria-label': 'New session',
				'data-tooltip-position': 'bottom'
			}
		});
		newButton.createSpan({ text: '➕' });
		newButton.addEventListener('click', () => this.handleNewSession());

		// Clear button
		const clearButton = actions.createEl('button', {
			cls: 'onyxmind-button',
			attr: {
				'aria-label': 'Clear messages',
				'data-tooltip-position': 'bottom'
			}
		});
		clearButton.createSpan({ text: '🗑️' });
		clearButton.addEventListener('click', () => this.handleClearMessages());
	}

	/**
	 * Create input area
	 */
	private createInputArea(): void {
		// Text area
		this.inputEl = this.inputContainer.createEl('textarea', {
			cls: 'onyxmind-input',
			attr: {
				placeholder: 'Ask me anything about your notes...',
				rows: '3'
			}
		});

		// Auto-resize textarea
		this.inputEl.addEventListener('input', () => {
			this.inputEl.style.height = 'auto';
			this.inputEl.style.height = this.inputEl.scrollHeight + 'px';
		});

		// Track IME composition to avoid sending on Enter during candidate selection
		this.inputEl.addEventListener('compositionstart', () => { this.isComposing = true; });
		this.inputEl.addEventListener('compositionend', () => { this.isComposing = false; });

		// Handle Enter key (Shift+Enter for new line)
		this.inputEl.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' && !e.shiftKey && !this.isComposing) {
				e.preventDefault();
				if (!this.isStreaming) this.handleSubmit();
			}
		});

		// Button row
		const buttonRow = this.inputContainer.createDiv('onyxmind-button-row');

		// Abort button (hidden initially)
		this.abortButton = buttonRow.createEl('button', {
			cls: 'onyxmind-abort-button',
			text: 'Stop',
			attr: {
				'aria-label': 'Stop generating'
			}
		});
		this.abortButton.style.display = 'none';
		this.abortButton.addEventListener('click', () => this.handleAbort());

		// Send button
		this.sendButton = buttonRow.createEl('button', {
			cls: 'onyxmind-send-button',
			text: 'Send',
			attr: {
				'aria-label': 'Send message'
			}
		});
		this.sendButton.addEventListener('click', () => this.handleSubmit());
	}

	/**
	 * Show welcome message
	 */
	private showWelcomeMessage(): void {
		const welcomeDiv = this.messagesContainer.createDiv('onyxmind-welcome');
		welcomeDiv.createEl('h3', { text: 'Welcome to OnyxMind!' });
		welcomeDiv.createEl('p', {
			text: 'I can help you with:'
		});

		const list = welcomeDiv.createEl('ul');
		list.createEl('li', { text: 'Answering questions about your notes' });
		list.createEl('li', { text: 'Generating new content' });
		list.createEl('li', { text: 'Improving your writing' });
		list.createEl('li', { text: 'Summarizing documents' });

		welcomeDiv.createEl('p', {
			text: 'Type your question below to get started.'
		});
	}

	/**
	 * Handle message submission
	 */
	private async handleSubmit(): Promise<void> {
		const text = this.inputEl.value.trim();
		if (!text) {
			return;
		}

		// Clear input
		this.inputEl.value = '';
		this.inputEl.style.height = 'auto';

		// Send message
		await this.sendMessage(text);
	}

	/**
	 * Send a message
	 */
	async sendMessage(text: string): Promise<void> {
		// Get or create active session
		let session = this.plugin.sessionManager.getActiveSession();
		if (!session) {
			session = await this.plugin.sessionManager.createSession();
			if (!session) {
				this.showError('Failed to create session');
				return;
			}
		}

		// Add user message
		const userMessage: Message = {
			role: 'user',
			content: text,
			timestamp: Date.now()
		};
		this.plugin.sessionManager.addMessage(session.id, userMessage);
		this.renderMessage(userMessage);

		// Enter streaming state (shows thinking indicator + abort button)
		this.setStreaming(true);

		// Send to OpenCode
		const stream = await this.plugin.opencodeService.sendPrompt(session.id, text);

		if (!stream) {
			this.setStreaming(false);
			this.showError('Failed to send message');
			return;
		}

		// Handle streaming response
		await this.handleStreamResponse(stream, session.id);
	}

	/**
	 * Toggle streaming UI state
	 * streaming=true: show thinking + abort button, hide/disable send
	 * streaming=false: hide thinking + abort button, restore send
	 */
	private setStreaming(streaming: boolean): void {
		this.isStreaming = streaming;
		this.showThinking(streaming);
		this.sendButton.style.display = streaming ? 'none' : '';
		this.abortButton.style.display = streaming ? '' : 'none';
		this.inputEl.disabled = streaming;
	}

	/**
	 * Handle abort button click
	 * Immediately updates UI, then signals server to stop
	 */
	private async handleAbort(): Promise<void> {
		// Immediately restore UI so the user gets instant feedback
		this.setStreaming(false);

		// Break the local for-await loop
		this.streamAbortController?.abort();

		// Tell the OpenCode server to stop ([Request interrupted by user])
		const session = this.plugin.sessionManager.getActiveSession();
		if (session) {
			await this.plugin.opencodeService.abortSession(session.id);
		}
	}

	/**
	 * Handle streaming response
	 */
	private async handleStreamResponse(
		stream: AsyncIterableIterator<any>,
		sessionId: string
	): Promise<void> {
		this.streamAbortController?.abort();
		this.streamAbortController = new AbortController();
		const signal = this.streamAbortController.signal;

		const messageEl = this.createMessageElement('assistant');
		const bodyEl = messageEl.querySelector('.onyxmind-message-body') as HTMLElement;
		const textEl = bodyEl.querySelector('.onyxmind-part-text') as HTMLElement;

		let fullContent = '';
		let thinkingContent = '';
		let thinkingContentEl: HTMLElement | null = null;

		const toolCards = new Map<string, { cardEl: HTMLElement; outputEl: HTMLElement }>();

		try {
			for await (const chunk of stream) {
				if (signal.aborted) break;

				if (chunk.type === 'content' && chunk.text) {
					fullContent += chunk.text;
					textEl.empty();
					await MarkdownRenderer.renderMarkdown(
						fullContent,
						textEl,
						'',
						this as any
					);
					this.scrollToBottom();
				} else if (chunk.type === 'reasoning' && chunk.text) {
					thinkingContent += chunk.text;
					if (!thinkingContentEl) {
						const { contentEl } = this.getOrCreateThinkingEl(bodyEl, textEl);
						thinkingContentEl = contentEl;
					}
					thinkingContentEl.textContent = thinkingContent;
					this.scrollToBottom();
				} else if (chunk.type === 'tool_use') {
					let entry = toolCards.get(chunk.partId);
					if (!entry) {
						entry = this.getOrCreateToolCard(bodyEl, textEl, chunk.partId, chunk.tool);
						toolCards.set(chunk.partId, entry);
					}
					this.updateToolCard(entry, chunk);
					this.scrollToBottom();
				} else if (chunk.type === 'error') {
					// Suppress abort-related errors — they are expected when the user stops generation
					const isAbortError = signal.aborted || chunk.error?.includes('MessageAbortedError');
					if (!isAbortError) {
						this.showError(chunk.error || 'Unknown error');
					}
				}
			}

			// Persist the (possibly partial) assistant message
			if (fullContent) {
				const assistantMessage: Message = {
					role: 'assistant',
					content: fullContent,
					timestamp: Date.now()
				};
				this.plugin.sessionManager.addMessage(sessionId, assistantMessage);
			}

		} catch (error) {
			if (!signal.aborted) {
				const message = error instanceof Error ? error.message : String(error);
				this.showError(message);
			}
		} finally {
			this.setStreaming(false);
		}
	}

	// ── Part renderers ──────────────────────────────────────────────────────

	/**
	 * Create or return the collapsible thinking block inside bodyEl.
	 * The details element is inserted before textEl so it appears above the text.
	 */
	private getOrCreateThinkingEl(
		bodyEl: HTMLElement,
		textEl: HTMLElement
	): { detailsEl: HTMLDetailsElement; contentEl: HTMLElement } {
		const existing = bodyEl.querySelector('.onyxmind-part-thinking') as HTMLDetailsElement | null;
		if (existing) {
			return {
				detailsEl: existing,
				contentEl: existing.querySelector('.onyxmind-thinking-content') as HTMLElement,
			};
		}
		const detailsEl = document.createElement('details') as HTMLDetailsElement;
		detailsEl.className = 'onyxmind-part-thinking';
		const summary = document.createElement('summary');
		summary.textContent = 'Thinking...';
		detailsEl.appendChild(summary);
		const contentEl = document.createElement('div');
		contentEl.className = 'onyxmind-thinking-content';
		detailsEl.appendChild(contentEl);
		bodyEl.insertBefore(detailsEl, textEl);
		return { detailsEl, contentEl };
	}

	/**
	 * Create or return a tool card for a specific partId.
	 * Cards are inserted before textEl so they appear above the final text.
	 */
	private getOrCreateToolCard(
		bodyEl: HTMLElement,
		textEl: HTMLElement,
		partId: string,
		tool: string
	): { cardEl: HTMLElement; outputEl: HTMLElement } {
		// Check if card already exists in DOM (e.g. after re-attach)
		const existing = bodyEl.querySelector(`[data-part-id="${partId}"]`) as HTMLElement | null;
		if (existing) {
			return {
				cardEl: existing,
				outputEl: existing.querySelector('.onyxmind-tool-output-content') as HTMLElement,
			};
		}

		const cardEl = document.createElement('div');
		cardEl.className = 'onyxmind-part-tool';
		cardEl.dataset['partId'] = partId;
		cardEl.dataset['tool'] = tool;
		cardEl.dataset['status'] = 'pending';

		// Header
		const header = document.createElement('div');
		header.className = 'onyxmind-tool-header';

		const iconSpan = document.createElement('span');
		iconSpan.className = 'onyxmind-tool-icon';
		iconSpan.textContent = toolIcon(tool);

		const nameSpan = document.createElement('span');
		nameSpan.className = 'onyxmind-tool-name';
		nameSpan.textContent = tool;

		const titleSpan = document.createElement('span');
		titleSpan.className = 'onyxmind-tool-title';

		const statusIconSpan = document.createElement('span');
		statusIconSpan.className = 'onyxmind-tool-status-icon';
		statusIconSpan.textContent = '⏳';

		header.appendChild(iconSpan);
		header.appendChild(nameSpan);
		header.appendChild(titleSpan);
		header.appendChild(statusIconSpan);
		cardEl.appendChild(header);

		// Output area (collapsed by default)
		const outputDetails = document.createElement('details');
		outputDetails.className = 'onyxmind-tool-output';
		const outputSummary = document.createElement('summary');
		outputSummary.textContent = 'Output';
		outputDetails.appendChild(outputSummary);

		const outputEl = document.createElement('div');
		outputEl.className = 'onyxmind-tool-output-content';
		outputDetails.appendChild(outputEl);
		cardEl.appendChild(outputDetails);

		bodyEl.insertBefore(cardEl, textEl);
		return { cardEl, outputEl };
	}

	/**
	 * Update a tool card's status, title, and output based on the incoming chunk.
	 */
	private updateToolCard(
		entry: { cardEl: HTMLElement; outputEl: HTMLElement },
		chunk: StreamChunkToolUse
	): void {
		const { cardEl, outputEl } = entry;
		cardEl.dataset['status'] = chunk.status;

		const statusIconEl = cardEl.querySelector('.onyxmind-tool-status-icon') as HTMLElement | null;
		const titleEl = cardEl.querySelector('.onyxmind-tool-title') as HTMLElement | null;

		if (chunk.title && titleEl) {
			titleEl.textContent = chunk.title;
		}

		switch (chunk.status) {
			case 'running':
				if (statusIconEl) statusIconEl.textContent = '⟳';
				break;
			case 'completed':
				if (statusIconEl) statusIconEl.textContent = '✓';
				if (chunk.output !== undefined) {
					outputEl.empty();
					const pre = document.createElement('pre');
					pre.textContent = chunk.output;
					outputEl.appendChild(pre);
				}
				break;
			case 'error':
				if (statusIconEl) statusIconEl.textContent = '✗';
				if (chunk.error) {
					outputEl.empty();
					const errEl = document.createElement('div');
					errEl.className = 'onyxmind-tool-output-error';
					errEl.textContent = chunk.error;
					outputEl.appendChild(errEl);
					// Expand output on error so user sees what went wrong
					const outputDetails = outputEl.parentElement as HTMLDetailsElement | null;
					if (outputDetails) outputDetails.open = true;
				}
				break;
		}
	}

	/**
	 * Render a message
	 */
	private renderMessage(message: Message): void {
		const messageEl = this.createMessageElement(message.role);
		const textEl = messageEl.querySelector('.onyxmind-part-text') as HTMLElement;

		// Render markdown
		MarkdownRenderer.renderMarkdown(
			message.content,
			textEl,
			'',
			this as any
		);

		this.scrollToBottom();
	}

	/**
	 * Create a message element
	 */
	private createMessageElement(role: 'user' | 'assistant'): HTMLElement {
		// Remove welcome message if it exists
		const welcome = this.messagesContainer.querySelector('.onyxmind-welcome');
		if (welcome) {
			welcome.remove();
		}

		const messageEl = this.messagesContainer.createDiv(`onyxmind-message onyxmind-message-${role}`);

		// Avatar
		const avatar = messageEl.createDiv('onyxmind-avatar');
		avatar.createSpan({ text: role === 'user' ? '👤' : '🤖' });

		// Body — parts are ordered: thinking → tool cards → text
		const bodyEl = messageEl.createDiv('onyxmind-message-body');
		// Text element is always last inside body
		bodyEl.createDiv('onyxmind-part-text');

		return messageEl;
	}

	/**
	 * Show/hide thinking indicator
	 */
	private showThinking(show: boolean): void {
		this.thinkingIndicator.style.display = show ? 'block' : 'none';
		if (show) {
			this.scrollToBottom();
		}
	}

	/**
	 * Show error message
	 */
	private showError(message: string): void {
		const errorEl = this.messagesContainer.createDiv('onyxmind-error');

		// Create error header
		const headerEl = errorEl.createDiv();
		headerEl.style.fontWeight = 'bold';
		headerEl.style.marginBottom = '8px';
		headerEl.createSpan({ text: '❌ Error' });

		// Create error message
		const messageEl = errorEl.createDiv();
		messageEl.style.whiteSpace = 'pre-wrap';
		messageEl.style.wordBreak = 'break-word';
		messageEl.setText(message);

		// Log to console for debugging
		console.error('[OnyxMind Error]:', message);

		this.scrollToBottom();
	}

	/**
	 * Scroll to bottom
	 */
	private scrollToBottom(): void {
		this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
	}

	/**
	 * Handle new session
	 */
	private async handleNewSession(): Promise<void> {
		const session = await this.plugin.sessionManager.createSession();
		if (session) {
			this.messagesContainer.empty();
			this.showWelcomeMessage();
		}
	}

	/**
	 * Handle clear messages
	 */
	private handleClearMessages(): void {
		const session = this.plugin.sessionManager.getActiveSession();
		if (session) {
			this.plugin.sessionManager.clearSessionMessages(session.id);
			this.messagesContainer.empty();
			this.showWelcomeMessage();
		}
	}
}
