import { App } from 'obsidian';
import OpenAI from 'openai';
import { INoteGenerationService, ITemplateService } from './interfaces';
import { TemplateService } from './templateService';

export class NoteGenerationService implements INoteGenerationService {
    private templateService: ITemplateService;
    private openai: OpenAI;

    constructor(templateService: ITemplateService = new TemplateService()) {
        this.templateService = templateService;
    }

    async generateNote(app: App, transcripts: string[], templatePath: string, apiKey: string): Promise<string> {
        const template = await this.templateService.loadTemplate(app, templatePath);
        
        this.openai = new OpenAI({
            apiKey: apiKey,
            dangerouslyAllowBrowser: true // Required for client-side usage
        });
        
        // Build system prompt with instructions and template.
        const systemPrompt = `You are a markdown note generator for obsidian.md second brains. Always respond with pure markdown content without any code blocks or annotations.
        
Use the provided template as a template to create a new log from the transcripts.
Keep the structure of the template intact and only replace the placeholders with the actual content.
E.g. Do NOT add any new sections.

Never use:  
- Code blocks  
- HTML tags  
- Unsupported Markdown syntax

- Do not change the speaker's voice or tone.
- Do not add any new information.
- Do not remove any information.

Template:
${template}`;
        
        // User message contains only the transcripts.
        const transcriptMessage = transcripts.join("\n\n---\n\n");
        
        const response = await this.openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: transcriptMessage }
            ],
            response_format: { type: "text" },
            temperature: 1,
            max_tokens: 4096,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0
        });

        const content = response.choices[0].message.content;
        if (!content) {
            throw new Error('No content received from OpenAI');
        }

        return content;
    }
}
