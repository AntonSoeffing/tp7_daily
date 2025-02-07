import { Plugin } from 'obsidian';
import { MyPluginSettings, DEFAULT_SETTINGS, SampleSettingTab } from './settings';
import { DailyLogModal } from './DailyLogModal';

export const VIEW_TYPE_DAILY_LOG = 'te-daily-log'; // Export the constant

export default class TP7DailyMemo extends Plugin {
    settings: MyPluginSettings;

    async onload() {
        await this.loadSettings();

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
