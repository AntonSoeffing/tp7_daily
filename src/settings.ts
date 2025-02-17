import { App, PluginSettingTab, Setting } from 'obsidian';
import TP7DailyMemo from './main';

export interface MyPluginSettings {
	journalFolder: string;
	dateFormat: string;
	openaiApiKey: string;
	useTestTranscript: boolean;
	dailyNoteTemplatePath: string;
	// New property for storing converted recordings
	recordingsFolder: string;
	settingsVersion: number;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	journalFolder: 'Daily Journal',
	dateFormat: 'DD.MM.YYYY',
	openaiApiKey: '',
	useTestTranscript: false,
	dailyNoteTemplatePath: '',
	recordingsFolder: 'recordings',
	settingsVersion: 1
}

export const PLUGIN_NAME = 'TP-7 Daily Memos';

export class SampleSettingTab extends PluginSettingTab {
	plugin: TP7DailyMemo;

	constructor(app: App, plugin: TP7DailyMemo) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Journal Folder')
			.setDesc('Folder to create daily notes in')
			.addText(text => text
				.setPlaceholder('Daily Journal')
				.setValue(this.plugin.settings.journalFolder)
				.onChange(async (value) => {
					this.plugin.settings.journalFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Date Format')
			.setDesc('Format of the date in the daily note title')
			.addText(text => text
				.setPlaceholder('DD.MM.YYYY')
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('OpenAI API Key')
			.setDesc('API key for OpenAI Whisper.')
			.addText(text => text
				.setPlaceholder('Enter your OpenAI API key')
				.setValue(this.plugin.settings.openaiApiKey)
				.onChange(async (value) => {
					this.plugin.settings.openaiApiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Use Test Transcript')
			.setDesc('Use a test transcript instead of calling the OpenAI API.')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useTestTranscript)
				.onChange(async (value) => {
					this.plugin.settings.useTestTranscript = value;
					await this.plugin.saveSettings();
					}));

		new Setting(containerEl)
			.setName('Daily Note Template Path')
			.setDesc('Path to the markdown file used as a template.')
			.addText(text => text
				.setPlaceholder('Enter your daily note template path')
				.setValue(this.plugin.settings.dailyNoteTemplatePath)
				.onChange(async (value) => {
					this.plugin.settings.dailyNoteTemplatePath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Recordings Folder')
			.setDesc('Folder in the vault where converted mp3 recordings will be stored')
			.addText(text => text
				.setPlaceholder('recordings')
				.setValue(this.plugin.settings.recordingsFolder)
				.onChange(async (value) => {
					this.plugin.settings.recordingsFolder = value;
					await this.plugin.saveSettings();
				}));
	}
}
