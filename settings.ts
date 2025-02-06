import { App, PluginSettingTab, Setting } from 'obsidian';
import TP7DailyMemo from './main';

export interface MyPluginSettings {
	journalFolder: string;
	dateFormat: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	journalFolder: 'Daily Journal',
	dateFormat: 'DD.MM.YYYY',
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
	}
}
