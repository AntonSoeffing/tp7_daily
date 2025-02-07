import { App } from 'obsidian';

export interface ITranscriptionService {
    transcribeAudio(audioFile: File, apiKey: string): Promise<string>;
}

export interface INoteGenerationService {
    generateNote(app: App, transcripts: string[], templatePath: string, apiKey: string): Promise<string>;
}

export interface ITemplateService {
    loadTemplate(app: App, templatePath: string): Promise<string>;
}
