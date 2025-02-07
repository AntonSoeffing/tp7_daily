import { ITranscriptionService } from './interfaces';
import { MyPluginSettings } from '../settings';

export class TranscriptionService implements ITranscriptionService {
    private settings: MyPluginSettings;
    private readonly TEST_TRANSCRIPT = `Ich hatte gerade irgendwie die Idee, man könnte ja ein Video machen mit dem Lied von Alex, also vielleicht könnte ich da einfach kurz quasi sowas zusammenschneiden aus den Sachen, die ich schon in Berlin aufgenommen habe. Das wäre eigentlich ganz cool`;

    constructor(settings: MyPluginSettings) {
        this.settings = settings;
    }

    async transcribeAudio(audioFile: File, apiKey: string): Promise<string> {
        if (this.settings.useTestTranscript) {
            return this.TEST_TRANSCRIPT;
        }

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
}
