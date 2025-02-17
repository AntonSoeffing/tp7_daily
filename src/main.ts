import { Plugin, MarkdownView, Editor } from 'obsidian';
import { MyPluginSettings, DEFAULT_SETTINGS, SampleSettingTab } from './settings';
import { DailyLogModal } from './DailyLogModal';
import LinkTracker from './linkTracker';
import { TrackedLinksModal } from './TrackedLinksModal';

export const VIEW_TYPE_DAILY_LOG = 'te-daily-log';

export default class TP7DailyMemo extends Plugin {
	settings: MyPluginSettings;
	linkTracker: LinkTracker;

	async onload() {
		console.log('Loading TP7 Daily Memos plugin');
		await this.loadSettings();
		this.linkTracker = new LinkTracker(this);
		await this.linkTracker.init();

		// Add command for command palette
		this.addCommand({
			id: 'open-tp7-daily-memo',
			name: 'Create Daily Note from TP-7 Memos',
			callback: () => {
				new DailyLogModal(this.app, this).open();
			}
		});

		// Add ribbon icon with better icon
		this.addRibbonIcon('audio-lines', 'Create Daily Note from TP-7', () => {
			new DailyLogModal(this.app, this).open();
		});

		// Add settings tab
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// Add command to display tracked links
		this.addCommand({
			id: 'show-tracked-links',
			name: 'Show Tracked Links',
			callback: () => {
				new TrackedLinksModal(this.app, this.linkTracker).open();
			}
		});

		// Removed editor-change event listener since metadata cache now handles link tracking.

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		// Force settings flush before deactivation (hot reload scenario)
		this.saveSettings();
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_DAILY_LOG);
		this.linkTracker.save();
	}

	async loadSettings() {
		const loadedData = await this.loadData();
		// Merge saved data with default settings for missing properties
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
		// Check localStorage for temporary settings from previous unload
		const tmpSettings = window.localStorage.getItem('tp7_daily_plugin_settings_temp');
		if (tmpSettings) {
			this.settings = Object.assign({}, this.settings, JSON.parse(tmpSettings));
			window.localStorage.removeItem('tp7_daily_plugin_settings_temp');
		}
		// If settings version differs, perform migration as needed
		if (this.settings.settingsVersion < DEFAULT_SETTINGS.settingsVersion) {
			// Example migration logic:
			// this.settings.someNewProperty = DEFAULT_SETTINGS.someNewProperty;
			this.settings.settingsVersion = DEFAULT_SETTINGS.settingsVersion;
			await this.saveSettings();
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Also cache settings in localStorage as a backup during hot reload
		window.localStorage.setItem('tp7_daily_plugin_settings_temp', JSON.stringify(this.settings));
	}
}
