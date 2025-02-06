export interface MyPluginSettings {
	journalFolder: string;
	dateFormat: string;
}

export const DEFAULT_SETTINGS: MyPluginSettings = {
	journalFolder: 'Daily Journal',
	dateFormat: 'DD.MM.YYYY'
}

export const PLUGIN_NAME = 'TP-7 Daily Memos';
