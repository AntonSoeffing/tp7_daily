import { MyPluginSettings } from './settings';

export async function transcribeAudio(audioFile: File, settings: MyPluginSettings): Promise<string> {
	if (settings.useTestTranscript) {
		return `Ich hatte gerade irgendwie die Idee, man könnte ja ein Video machen mit dem Lied von Alex, also vielleicht könnte ich da einfach kurz quasi sowas zusammenschneiden aus den Sachen, die ich schon in Berlin aufgenommen habe. Das wäre eigentlich ganz cool`;
	}

	const apiKey = settings.openaiApiKey;
	if (!apiKey) {
		throw new Error('OpenAI API key is not set in the settings.');
	}

	const formData = new FormData();
	formData.append('file', audioFile);
	formData.append('model', 'whisper-1');

	const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`
		},
		body: formData
	});

	if (!response.ok) {
		throw new Error(`Transcription failed: ${response.statusText}`);
	}

	const data = await response.json();
	return data.text;
}