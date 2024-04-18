import { DEFAULT_SETTINGS, DEFAULT_SLURP_PROPS } from './src/const';
import { App, MarkdownView, Notice, Plugin } from 'obsidian';
import type { SlurpArticle } from './src/types/article';
import { SlurpProp, type SlurpProps } from './src/slurp-prop';
import { createFilePath, sortSlurpProps } from './src/util';
import { createFrontMatter } from './src/frontmatter';
import { fetchHtml, parsePage, mergeMetadata, parseMetadata, parseMarkdown } from './src/parse';
import { SlurpNewNoteModal } from './src/modals/new-note';
import { SlurpSettingsTab } from 'src/settings';
import type { SlurpSettings } from 'src/types/settings';
import type { FormatterArgs } from 'src/types/misc';

export default class SlurpPlugin extends Plugin {
	settings!: SlurpSettings;
	slurpProps!: SlurpProps;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new SlurpSettingsTab(this.app, this));

		this.addCommand({
			id: 'create-note-from-url',
			name: 'Create note from URL',
			callback: () => {
				new SlurpNewNoteModal(this.app, this).open();
			}
		});

		this.registerObsidianProtocolHandler("slurp", async (e) => {
			if (!e.url || e.url == "") console.error("URI is empty or undefined");

			try {
				this.slurp(e.url);
			} catch (err) { this.displayError(err as Error); }
		});
	}

	onunload() { }

	fixTagPrefix() {
		this.settings.tagPrefix = this.settings.tagPrefix.endsWith('/')
			? this.settings.tagPrefix.substring(0, this.settings.tagPrefix.length - 1)
			: this.settings.tagPrefix;
	}

	fixPropIdx() {
		const props = Object.values<SlurpProp<any>>(this.slurpProps);
		sortSlurpProps(props);
		props.forEach((prop, idx) => prop.idx = idx);
	}

	migrateSettings() {
		this.fixTagPrefix();
		this.fixPropIdx();
		this.saveSettings();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.slurpProps = SlurpProp.fromSettings(this.settings.propSettings, DEFAULT_SLURP_PROPS);
		this.migrateSettings();
	}

	async saveSettings() {
		for (let i in this.slurpProps) {
			this.settings.propSettings[i] = this.slurpProps[i].getSetting();
		}
		await this.saveData(this.settings);
	}

	displayError = (err: Error) => new Notice(`Slurp Error! ${err.message}`);

	async slurp(url: string): Promise<void> {
		const doc = new DOMParser().parseFromString(await fetchHtml(url), 'text/html');

		const article: SlurpArticle = {
			slurpedTime: new Date(),
			tags: new Set<FormatterArgs>(),
			...parsePage(doc)
		};

		// find metadata that readability doesn't pick up
		const parsedMetadata = parseMetadata(doc, this.slurpProps, this.settings.tagPrefix, this.settings.tagCase)

		await this.slurpNewNoteCallback({
			...mergeMetadata(article, parsedMetadata),
			content: parseMarkdown(article.content),
			link: url
		});
	}

	async slurpNewNoteCallback(article: SlurpArticle) {
		const frontMatter = createFrontMatter(article, this.slurpProps, this.settings.showEmptyProps);
		const content = `---\n${frontMatter}\n---\n${article.content}`;

		const filePath = await createFilePath(this.app.vault, article.title);
		const newFile = await this.app.vault.create(filePath, content);
		this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf.openFile(newFile);
	}
}
