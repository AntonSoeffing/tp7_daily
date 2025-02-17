import { Notice, TFile, App, Modal, Setting, moment } from 'obsidian';
import { MyPluginSettings } from './settings';
import { ITranscriptionService } from './services/interfaces';
import { NoteGenerationService } from './services/noteGenerationService';

class FileExistsModal extends Modal {
    private result: boolean = false;
    private resolved: boolean = false;
    private resolvePromise: ((value: boolean) => void) | null = null;

    constructor(app: App, private fileName: string) {
        super(app);
    }

    async waitForClose(): Promise<boolean> {
        return new Promise((resolve) => {
            this.resolvePromise = resolve;
        });
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl("h2", { text: "File Already Exists" });
        contentEl.createEl("p", { text: `"${this.fileName}" already exists. Would you like to create a new version?` });

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText("Cancel")
                .onClick(() => {
                    this.result = false;
                    this.close();
                }))
            .addButton(btn => btn
                .setButtonText("Create New Version")
                .setCta()
                .onClick(() => {
                    this.result = true;
                    this.close();
                }));
    }

    onClose() {
        if (this.resolvePromise) {
            this.resolvePromise(this.result);
        }
        const { contentEl } = this;
        contentEl.empty();
    }
}

export async function createDailyNote(
    app: App,
    selectedDate: string,
    audioFiles: File[],
    settings: MyPluginSettings,
    transcriptionService: ITranscriptionService,
    trackedLinks?: { link: string; timestamp: number; source: string }[]
): Promise<void> {
    if (!selectedDate) {
        new Notice('Please select a date.');
        return;
    }

    if (audioFiles.length === 0 && !settings.useTestTranscript) {
        new Notice('Please provide audio files or enable test mode.');
        return;
    }

    const noteGenerationService = new NoteGenerationService();
    const formattedDate = window.moment(selectedDate, 'YYYY-MM-DD').format(settings.dateFormat);
    const fileName = `${formattedDate}.md`;
    const filePath = `${settings.journalFolder}/${fileName}`;

    let finalFilePath = filePath;
    const existingFile = app.vault.getAbstractFileByPath(filePath);
    
    if (existingFile instanceof TFile) {
        const modal = new FileExistsModal(app, fileName);
        modal.open();
        
        const shouldContinue = await modal.waitForClose();
        if (!shouldContinue) {
            return;
        }

        // Create new version of the file
        let counter = 1;
        const baseName = fileName.replace('.md', '');
        while (app.vault.getAbstractFileByPath(`${settings.journalFolder}/${baseName} - ${counter}.md`) instanceof TFile) {
            counter++;
        }
        finalFilePath = `${settings.journalFolder}/${baseName} - ${counter}.md`;
    }

    try {
        const transcripts = settings.useTestTranscript 
            ? [await transcriptionService.transcribeAudio(new File([], 'test.wav'), settings.openaiApiKey)]
            : await Promise.all(
                audioFiles.map(file => transcriptionService.transcribeAudio(file, settings.openaiApiKey, trackedLinks || []))
            );

        let generatedContent = await noteGenerationService.generateNote(
            app,
            transcripts,
            settings.dailyNoteTemplatePath,
            settings.openaiApiKey
        );

        generatedContent += '\n\n> [!quote]- Transcripts\n';

        // Append transcripts to the generated content
        if (settings.useTestTranscript) {
            generatedContent += `> > [!quote]- Test Transcript\n> > ${transcripts[0]}\n\n`;
        } else {
            audioFiles.forEach((audioFile, index) => {
                const transcript = transcripts[index];
                const [date, time] = audioFile.name.split('_').slice(0, 2);
                const formattedDate = window.moment(date, 'YYYY-MM-DD').format(settings.dateFormat);
                const formattedTime = `${time.slice(0, 2)}:${time.slice(2, 4)}:${time.slice(4, 6)}`;
                generatedContent += `> > [!quote]- Transcript for ${formattedDate} at ${formattedTime}\n> > ${transcript}\n>\n`;
            });
        }
        

        await app.vault.create(finalFilePath, generatedContent);
        new Notice(`Created daily note: ${finalFilePath}`);
    } catch (error) {
        new Notice(`Error creating daily note: ${error}`);
    }
}
