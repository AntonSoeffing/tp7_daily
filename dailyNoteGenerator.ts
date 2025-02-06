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
	Template:
	${template}
	
	Below are the transcripts for today's recordings:
	${transcripts.join("\n")}
	`;
	
	const response = await fetch('https://api.openai.com/v1/completions', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			model: 'o3-mini',
			prompt,
			max_tokens: 800
		})
	});

	if (!response.ok) {
		throw new Error(`Daily note generation failed: ${response.statusText}`);
	}

	const data = await response.json();
	return data.choices[0].text.trim();
}