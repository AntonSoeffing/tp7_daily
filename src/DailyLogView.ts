import { ItemView, WorkspaceLeaf, Plugin, Notice, TFile, TFolder } from 'obsidian';
import TP7DailyMemo, { VIEW_TYPE_DAILY_LOG } from './main'; // Import the main plugin class and named export
import { createDailyNote } from './dailyLogCreator';
import { TranscriptionService } from './services/transcriptionService';

export default class DailyLogView extends ItemView {
	plugin: TP7DailyMemo; // Use the actual plugin class type
	audioFiles: File[] = [];

	constructor(leaf: WorkspaceLeaf, plugin: TP7DailyMemo) {
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

		// Get the current date in YYYY-MM-DD format
		const today = new Date().toISOString().split('T')[0];

		// Create a date input for the journal date
		const dateInput = this.contentEl.createEl('input', { type: 'date' });
		dateInput.value = today; // Set the default value to today's date

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
			if (e.dataTransfer?.files) {
				this.audioFiles = Array.from(e.dataTransfer.files);
				new Notice(`Added ${this.audioFiles.length} audio files.`);
			}
		});

		// Create a "Create Daily Note" button
		const createButton = this.contentEl.createEl('button', { text: 'Create Daily Note' });
		createButton.addEventListener('click', async () => {
			const selectedDate = dateInput.value;
			const transcriptionService = new TranscriptionService(this.plugin.settings);

			await createDailyNote(
				this.app,
				selectedDate,
				this.audioFiles,
				this.plugin.settings,
				transcriptionService
			);

			this.audioFiles = [];
		});
		// ...existing code...
	}

	async onClose() {
		// ...existing code...
	}
}
