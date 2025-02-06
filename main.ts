import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
// Removed import for TranscriberView and VIEW_TYPE_TRANSCRIBER
import DailyLogView, { VIEW_TYPE_DAILY_LOG } from './DailyLogView';
import { MyPluginSettings, DEFAULT_SETTINGS } from './settings';

export default class TP7DailyMemo extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// Register the custom daily log view instead of transcriber view
		this.registerView(VIEW_TYPE_DAILY_LOG, (leaf) => new DailyLogView(leaf, this));

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'TP-7 Daily Memo', async (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			// Open the DailyLogView
			this.app.workspace.detachLeavesOfType(VIEW_TYPE_DAILY_LOG);

			const rightLeaf = this.app.workspace.getRightLeaf(false);
			if (rightLeaf) {
				await rightLeaf.setViewState({
					type: VIEW_TYPE_DAILY_LOG,
					active: true,
				});
			}

			this.app.workspace.revealLeaf(
				this.app.workspace.getLeavesOfType(VIEW_TYPE_DAILY_LOG)[0]
			);
		});
		// Perform additional things with the ribbon
		if (ribbonIconEl) {
			ribbonIconEl.addClass('my-plugin-ribbon-class');
		}

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	// Removed activateTranscriberView() and activateView() or update them if needed.
	// You may add new functions to activate the DailyLogView, if required.

	onunload() {
		this.app.workspace.detachLeavesOfType(VIEW_TYPE_DAILY_LOG);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: TP7DailyMemo;

	constructor(app: App, plugin: TP7DailyMemo) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(((this.plugin.settings as any).mySetting) || '')
				.onChange(async (value) => {
					(this.plugin.settings as any).mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
