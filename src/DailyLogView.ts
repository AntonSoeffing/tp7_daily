import { ItemView, WorkspaceLeaf, Notice, TFile, TFolder, Setting, ButtonComponent } from 'obsidian';
import TP7DailyMemo, { VIEW_TYPE_DAILY_LOG } from './main';
import { createDailyNote } from './dailyLogCreator';
import { TranscriptionService } from './services/transcriptionService';

export default class DailyLogView extends ItemView {
	plugin: TP7DailyMemo;
	audioFiles: File[] = [];
	isCreatingNote: boolean = false; // Add a flag to track note creation status
	createButton: ButtonComponent;

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
		this.createUI();

		// Attach drag event listeners to the whole view.
		this.contentEl.addEventListener('dragover', (e) => {
			e.preventDefault();
			e.stopPropagation();
		});
		this.contentEl.addEventListener('dragenter', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.contentEl.classList.add('dragover');
		});
		this.contentEl.addEventListener('dragleave', (e) => {
			e.preventDefault();
			e.stopPropagation();
			this.contentEl.classList.remove('dragover');
		});
		this.contentEl.addEventListener('drop', (e: DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			this.contentEl.classList.remove('dragover');
			if (e.dataTransfer?.files) {
				const newFiles = Array.from(e.dataTransfer.files).filter(file => !this.isFileAlreadyAdded(file));
				this.audioFiles.push(...newFiles);
				new Notice(`Added ${newFiles.length} audio files.`);
				(window as any).updateAudioFilesView();
			}
		});
	}

	createUI() {
		const { contentEl } = this;
		contentEl.createEl('h1', { text: 'Create Daily Log from TP-7 Memos' });

		let datePicker: HTMLInputElement;
		new Setting(contentEl)
			.setName('Journal Date')
			.setDesc('Select the date for the journal entry')
			.addText(text => {
				text.inputEl.type = 'date';
				const initial = new Date().toISOString().split('T')[0];
				text.setValue(initial);
				datePicker = text.inputEl;
				text.onChange(value => datePicker.value = value);
			});

		// Combined area for listing audio files.
		const dropSetting = new Setting(contentEl)
			.setName('Upload Audio Files')
			.setDesc('Drag and drop your TP-7 audio files anywhere in the view');
		// Container for displaying the list.
		const audioFilesContainer = dropSetting.controlEl.createEl('div', { cls: 'audio-files-container' });
		
		// Helper function to update the file list view.
		const updateAudioFilesView = () => {
			audioFilesContainer.empty();
			if (this.audioFiles.length === 0) {
				audioFilesContainer.createEl('p', { text: 'No files added.' });
			} else {
				this.audioFiles.forEach((file, idx) => {
					const item = audioFilesContainer.createEl('div', { cls: 'setting-item' });
					const info = item.createEl('div', { cls: 'setting-item-info' });
					info.createEl('div', { cls: 'setting-item-name', text: file.name });
					const control = item.createEl('div', { cls: 'setting-item-control' });
					const removeButton = control.createEl('button', { text: 'Remove' });
					removeButton.addEventListener('click', () => {
						this.audioFiles.splice(idx, 1);
						updateAudioFilesView();
						new Notice(`Removed ${file.name}`);
					});
				});
			}
		};
		// Expose updateAudioFilesView to the drop event.
		(window as any).updateAudioFilesView = updateAudioFilesView;
		updateAudioFilesView();

		// Create button with full width and loading indicator
		new Setting(contentEl)
			.addButton(button => {
				this.createButton = button
					.setButtonText('Create Daily Note')
					.setCta()
					.onClick(async () => {
						if (this.isCreatingNote) return; // Prevent multiple clicks
						this.isCreatingNote = true;
						this.createButton.setButtonText('Creating Daily Note...'); // Change button text to indicate loading
						this.createButton.setDisabled(true); // Disable the button to prevent multiple clicks

						try {
							const transcriptionService = new TranscriptionService(this.plugin.settings);
							await createDailyNote(
								this.app,
								datePicker.value,
								this.audioFiles,
								this.plugin.settings,
								transcriptionService
							);
							updateAudioFilesView();
						} finally {
							this.isCreatingNote = false;
							this.createButton.setButtonText('Create Daily Note'); // Restore button text
							this.createButton.setDisabled(false); // Enable the button
						}
					});
			});
	}

	async onClose() {
		// ...existing code...
	}

	isFileAlreadyAdded(file: File): boolean {
		return this.audioFiles.some(existingFile =>
			existingFile.name === file.name &&
			existingFile.size === file.size &&
			existingFile.lastModified === file.lastModified
		);
	}
}
