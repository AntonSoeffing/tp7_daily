import { App, Modal, Notice, Setting, ButtonComponent } from 'obsidian';
import { createDailyNote } from './dailyLogCreator';
import { TranscriptionService } from './services/transcriptionService';
import TP7DailyMemo from './main';
import moment from 'moment';

export class DailyLogModal extends Modal {
    private audioFiles: File[] = [];
    private plugin: TP7DailyMemo;

    constructor(app: App, plugin: TP7DailyMemo) {
        super(app);
        this.plugin = plugin;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        contentEl.createEl('h2', { text: 'Create Daily Log from TP-7 Memos' });

        // Create a settings container
        const settingsContainer = contentEl.createEl('div', { cls: 'tp7-settings-container' });

        // Date picker setting
        let datePicker: HTMLInputElement;
        new Setting(settingsContainer)
            .setName('Journal Date')
            .setDesc('Select the date for the journal entry')
            .addText(text => {
                text.inputEl.type = 'date';
                text.setValue(new Date().toISOString().split('T')[0]);
                datePicker = text.inputEl;
            });

        // Audio files section integrated as a setting
        new Setting(settingsContainer)
            .setName('Audio Files')
            .setDesc('Add your TP-7 audio recordings');

        // Drop zone directly after the setting header
        const dropZone = settingsContainer.createEl('div', { 
            cls: 'tp7-drop-zone',
            text: 'Drop your TP-7 audio files here\nor click to select files'
        });
        
        this.setupDragAndDrop(dropZone);

        // File list container
        const fileListContainer = settingsContainer.createEl('div', { cls: 'tp7-file-list' });
        this.updateFileList(fileListContainer);

        // Create button
        new Setting(settingsContainer)
            .addButton(button => {
                button
                    .setButtonText('Create Daily Note')
                    .setCta()
                    .onClick(async () => {
                        if (button.disabled) return;
                        button.setButtonText('Creating...');
                        button.setDisabled(true);

                        try {
                            const transcriptionService = new TranscriptionService(this.plugin.settings);
                            await createDailyNote(
                                this.app,
                                datePicker.value,
                                this.audioFiles,
                                this.plugin.settings,
                                transcriptionService
                            );
                            this.close();
                        } finally {
                            button.setButtonText('Create Daily Note');
                            button.setDisabled(false);
                        }
                    });
            });
    }

    private formatFileName(fileName: string): { displayDate: string, displayTime: string, sequence: string } {
        const [date, time, sequence] = fileName.split('_');
        return {
            displayDate: moment(date, 'YYYY-MM-DD').format(this.plugin.settings.dateFormat),
            displayTime: `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`,
            sequence: sequence.replace('.wav', '')
        };
    }

    private updateFileList(fileListContainer: HTMLElement) {
        fileListContainer.empty();

        if (this.audioFiles.length === 0) {
            new Setting(fileListContainer)
                .setDesc('No audio files added yet');
            return;
        }

        // Sort files before displaying
        const sortedFiles = this.sortAudioFiles(this.audioFiles);

        sortedFiles.forEach((file, index) => {
            const { displayDate, displayTime, sequence } = this.formatFileName(file.name);
            const displayText = sequence !== '000' ? 
                `${displayDate} at ${displayTime} (${sequence})` : 
                `${displayDate} at ${displayTime}`;

            new Setting(fileListContainer)
                .setName(displayText)
                .setDesc(file.name)
                .addButton(btn => 
                    btn.setIcon('trash')
                       .setTooltip('Remove')
                       .onClick(() => {
                           this.audioFiles.splice(index, 1);
                           this.updateFileList(fileListContainer);
                       }));
        });
    }

    private sortAudioFiles(files: File[]): File[] {
        return [...files].sort((a, b) => {
            // Extract date and time from filenames (format: YYYY-MM-DD_HHMMSS_000.wav)
            const [dateA, timeA] = a.name.split('_');
            const [dateB, timeB] = b.name.split('_');
            
            // Create comparable timestamps
            const timestampA = moment(`${dateA} ${timeA.slice(0, 2)}:${timeA.slice(2, 4)}:${timeA.slice(4, 6)}`, 'YYYY-MM-DD HH:mm:ss');
            const timestampB = moment(`${dateB} ${timeB.slice(0, 2)}:${timeB.slice(2, 4)}:${timeB.slice(4, 6)}`, 'YYYY-MM-DD HH:mm:ss');
            
            return timestampA.valueOf() - timestampB.valueOf();
        });
    }

    private setupDragAndDrop(dropZone: HTMLElement) {
        const preventDefaults = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
        };

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        dropZone.addEventListener('dragenter', () => dropZone.addClass('dragover'));
        dropZone.addEventListener('dragleave', () => dropZone.removeClass('dragover'));
        dropZone.addEventListener('drop', (e: DragEvent) => {
            dropZone.removeClass('dragover');
            if (e.dataTransfer?.files) {
                const newFiles = Array.from(e.dataTransfer.files)
                    .filter(file => !this.audioFiles.some(existing => 
                        existing.name === file.name && 
                        existing.size === file.size
                    ));
                this.audioFiles.push(...newFiles);
                
                // Sort files after adding new ones
                this.audioFiles = this.sortAudioFiles(this.audioFiles);
                
                const fileList = dropZone.parentElement?.querySelector('.tp7-file-list');
                if (fileList instanceof HTMLElement) {
                    this.updateFileList(fileList);
                }
                new Notice(`Added ${newFiles.length} audio files`);
            }
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
