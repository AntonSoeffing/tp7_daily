import { Plugin, debounce, Editor } from 'obsidian';

export interface LinkEntry {
  link: string;
  timestamp: number;
  source: string;
}

export default class LinkTracker {
  private plugin: Plugin;
  private trackedLinks: LinkEntry[] = [];
  private lastContent = "";
  private currentFile = "";

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  async init() {
    await this.loadSavedLinks();
    
    const processLinks = debounce(
      (editor: Editor) => this.handleEditorChange(editor),
      1800, // 1.8-second debounce
      true
    );

    this.plugin.registerEvent(
      this.plugin.app.workspace.on('editor-change', (editor: Editor) => {
        if (this.plugin.app.workspace.activeEditor?.editor === editor) {
          this.currentFile = this.plugin.app.workspace.getActiveFile()?.path || "";
          processLinks(editor);
        }
      })
    );
  }

  private async loadSavedLinks() {
    this.trackedLinks = (await this.plugin.loadData())?.links || [];
  }

  private handleEditorChange(editor: Editor) {
    const newContent = editor.getValue();
    if (newContent === this.lastContent) return;

    const newLinks = this.findCompletedLinks(newContent);
    newLinks.forEach(link => this.trackLink(link));
    
    this.lastContent = newContent;
    this.plugin.saveData({ links: this.trackedLinks });
  }

  private findCompletedLinks(content: string): string[] {
    const linkRegex = /\[\[([^\]]+?)\]\]/g;
    const currentLinks = [...content.matchAll(linkRegex)]
      .map(m => m[1].trim())
      .filter(link => link.length > 0);

    const previousLinks = [...this.lastContent.matchAll(linkRegex)]
      .map(m => m[1].trim());

    return currentLinks.filter(link => 
      !previousLinks.includes(link) &&
      !this.trackedLinks.some(t => t.link === link)
    );
  }

  private trackLink(link: string) {
    this.trackedLinks = [{
      link,
      timestamp: Date.now(),
      source: this.currentFile
    }, ...this.trackedLinks].slice(0, 100);
    
    console.log('Tracked stable link:', link);
  }

  // Added method to retrieve tracked links
  public getLinks(): LinkEntry[] {
    return this.trackedLinks;
  }

  // Added method to save tracked links
  public async save() {
    await this.plugin.saveData({ links: this.trackedLinks });
  }
}
