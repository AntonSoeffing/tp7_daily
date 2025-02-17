import { Modal, App } from 'obsidian';
import LinkTracker, { LinkEntry } from './linkTracker';

export class TrackedLinksModal extends Modal {
	private linkTracker: LinkTracker;

	constructor(app: App, linkTracker: LinkTracker) {
		super(app);
		this.linkTracker = linkTracker;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.createEl('h2', { text: 'Tracked Links' });

		const links = this.linkTracker.getLinks();
		if (links.length === 0) {
			contentEl.createEl('p', { text: 'No links tracked yet.' });
		} else {
			const listEl = contentEl.createEl('ul');
			links.forEach((link: LinkEntry) => {
				listEl.createEl('li', { text: `${link.link} (from ${link.source} at ${new Date(link.timestamp).toLocaleString()})` });
			});
		}
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
