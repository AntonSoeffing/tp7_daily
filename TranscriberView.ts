import { ItemView, WorkspaceLeaf, Plugin } from 'obsidian';
export const VIEW_TYPE_TRANSCRIBER = 'te-transcriber';

export default class TranscriberView extends ItemView {
	plugin: Plugin;
	constructor(leaf: WorkspaceLeaf, plugin: Plugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_TRANSCRIBER;
	}

	getDisplayText(): string {
		return "Hello World View";
	}

	async onOpen() {
		this.contentEl.empty();
		this.contentEl.createEl('h1', { text: 'Hello, world!' });
	}

	async onClose() {
		// ...existing code...
	}
}
