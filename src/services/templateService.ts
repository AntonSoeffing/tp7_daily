import { App, TFile } from 'obsidian';
import { ITemplateService } from './interfaces';

export class TemplateService implements ITemplateService {
    async loadTemplate(app: App, templatePath: string): Promise<string> {
        const file = app.vault.getAbstractFileByPath(templatePath);
        if (file instanceof TFile) {
            return await app.vault.read(file);
        }
        throw new Error(`Template file not found at ${templatePath}`);
    }
}
