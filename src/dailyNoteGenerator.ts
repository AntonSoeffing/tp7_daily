import { MyPluginSettings } from './settings';
import { App, TFile } from 'obsidian';

async function loadTemplateContent(app: App, templatePath: string): Promise<string> {
    const file = app.vault.getAbstractFileByPath(templatePath);
    if (file instanceof TFile) {
        return await app.vault.read(file);
    }
    throw new Error(`Template file not found at ${templatePath}`);
}

export async function generateDailyNoteFromTranscripts(
    app: App,
    transcripts: string[],
    templatePath: string,
    apiKey: string
): Promise<string> {
    const template = await loadTemplateContent(app, templatePath);
    const prompt = `
    Based on the template below and the provided transcripts, create a well-structured daily note. 
    Keep the structure and formatting from the template, but fill it with relevant information from the transcripts.
    
    Template:
    ${template}
    
    Transcripts:
    ${transcripts.join("\n\n---\n\n")}
    `;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.7,
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        throw new Error(`Daily note generation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
}