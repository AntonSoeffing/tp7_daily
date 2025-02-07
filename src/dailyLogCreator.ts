import { Notice, TFile, App } from 'obsidian';
import { MyPluginSettings } from './settings';
import { ITranscriptionService } from './services/interfaces';
import { NoteGenerationService } from './services/noteGenerationService';
import moment from 'moment';

export async function createDailyNote(
    app: App,
    selectedDate: string,
    audioFiles: File[],
    settings: MyPluginSettings,
    transcriptionService: ITranscriptionService
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
    const formattedDate = moment(selectedDate, 'YYYY-MM-DD').format(settings.dateFormat);
    const fileName = `${formattedDate}.md`;
    const filePath = `${settings.journalFolder}/${fileName}`;

    if (app.vault.getAbstractFileByPath(filePath) instanceof TFile) {
        new Notice(`File ${fileName} already exists.`);
        return;
    }

    try {
        const transcripts = settings.useTestTranscript 
            ? [await transcriptionService.transcribeAudio(new File([], 'test.wav'), settings.openaiApiKey)]
            : await Promise.all(
                audioFiles.map(file => transcriptionService.transcribeAudio(file, settings.openaiApiKey))
            );

        const generatedContent = await noteGenerationService.generateNote(
            app,
            transcripts,
            settings.dailyNoteTemplatePath,
            settings.openaiApiKey
        );

        await app.vault.create(filePath, generatedContent);
        new Notice(`Created daily note: ${filePath}`);
    } catch (error) {
        new Notice(`Error creating daily note: ${error}`);
    }
}
