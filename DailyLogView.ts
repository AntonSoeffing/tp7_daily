import { ItemView, WorkspaceLeaf, Plugin } from 'obsidian';
export const VIEW_TYPE_DAILY_LOG = 'te-daily-log';

export default class DailyLogView extends ItemView {
	plugin: Plugin;
	constructor(leaf: WorkspaceLeaf, plugin: Plugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_DAILY_LOG;
	}

	getDisplayText(): string {
		return "Daily Log View";
	}

	async onOpen() {
		this.contentEl.empty();
		// Create a header
		this.contentEl.createEl('h1', { text: 'Create Daily Log from TP-7 Memos' });
		// Create a date input for the journal date
		const dateInput = this.contentEl.createEl('input', { type: 'text', placeholder: 'Enter date (e.g. 20.12.2025)' });
		// Create a drop zone for file uploads
		const dropZone = this.contentEl.createEl('div', { text: 'Drop your TP-7 audio files here' });
		dropZone.style.border = '2px dashed #ccc';
		dropZone.style.padding = '20px';
		dropZone.style.marginTop = '10px';
		// Add file drop event listeners
		dropZone.addEventListener('dragover', (e) => {
			e.preventDefault();
			dropZone.style.backgroundColor = '#fafafa';
		}); 
		dropZone.addEventListener('dragleave', (e) => {
			e.preventDefault();
			dropZone.style.backgroundColor = 'transparent';
		});
		dropZone.addEventListener('drop', (e: DragEvent) => {
			e.preventDefault();
			// ...existing file processing code...
			// Here you would add your call to OpenAI Whisper for transcription and later
			// the o3-mini for note generation.
		});
		// ...existing code...
	}

	async onClose() {
		// ...existing code...
	}
}
