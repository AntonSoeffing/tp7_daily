import { ITranscriptionService } from './interfaces';
import { MyPluginSettings } from '../settings';

export class TranscriptionService implements ITranscriptionService {
    private settings: MyPluginSettings;
    private readonly TEST_TRANSCRIPT = `Ich hatte gerade irgendwie die Idee, man könnte ja ein Video machen mit dem Lied von Alex, also vielleicht könnte ich da einfach kurz quasi sowas zusammenschneiden aus den Sachen, die ich schon in Berlin aufgenommen habe. Das wäre eigentlich ganz cool`;

    constructor(settings: MyPluginSettings) {
        this.settings = settings;
    }

    private createContextPrompt(links: { link: string; timestamp: number; source: string }[]): string {
        const maxTokens = 200;
        // Sort links in ascending order: oldest first, most recent last.
        const sortedLinks = links.slice().sort((a, b) => a.timestamp - b.timestamp);
        // Start from the most recent and add links until estimated tokens exceed the limit.
        const selectedLinks: string[] = [];
        let tokenCount = 0;
        for (let i = sortedLinks.length - 1; i >= 0; i--) {
            const linkText = sortedLinks[i].link;
            // Estimate tokens by approximating one token per 4 characters.
            const linkTokens = Math.ceil(linkText.length / 4);
            if (tokenCount + linkTokens > maxTokens) {
                break;
            }
            selectedLinks.push(linkText);
            tokenCount += linkTokens;
        }
        // Reverse to keep ascending order (oldest first, most recent last).
        selectedLinks.reverse();
        const prompt = `We talked about these concepts recently: ${selectedLinks.join(', ')}`;
        console.log('Using Whisper prompt:', prompt);
        return prompt;
    }

    async transcribeAudio(audioFile: File, apiKey: string, links: { link: string; timestamp: number; source: string }[] = []): Promise<string> {
        if (this.settings.useTestTranscript) {
            return this.TEST_TRANSCRIPT;
        }

        if (!apiKey) {
            throw new Error('OpenAI API key is not set in the settings.');
        }

        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', 'whisper-1');

        // Append prompt if links are provided
        if (links.length) {
            formData.append('prompt', this.createContextPrompt(links));
        }

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
