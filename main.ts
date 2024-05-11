import { MarkdownView, Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS } from './src/const';
import { createFrontMatter, createFrontMatterPropSettings, createFrontMatterProps } from './src/frontmatter';
import { getNewFilePath } from "./src/lib/files";
import { Logger } from './src/lib/logger';
import { removeTrailingSlash } from './src/lib/util';
import { SlurpNewNoteModal } from './src/modals/new-note';
import { fetchHtml, mergeMetadata, parseMarkdown, parseMetadata, parsePage } from './src/parse';
import { SlurpSettingsTab } from './src/settings';
import type { FormatterArgs, IArticle, IFrontMatterSettings, IFrontMatterTagSettings, ISettings, ISettingsV0, TFrontMatterProps } from './src/types';

export default class SlurpPlugin extends Plugin {
	settings!: ISettings;
	fmProps!: TFrontMatterProps;
	logger!: Logger;

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
			if (!e.url || e.url === "") console.error("URI is empty or undefined");

			try {
				this.slurp(e.url);
			} catch (err) { this.displayError(err as Error); }
		});
	}

	onunload() { }

	migrateSettingsV0toV1(loadedSettings: ISettingsV0 | ISettings): ISettings {
		// only v0 lacks the settingsVersion key
		if (Object.keys(loadedSettings).contains("settingsVersion")) return loadedSettings as ISettings;
		if (Object.keys(loadedSettings).length === 0) return DEFAULT_SETTINGS;

		const v0 = loadedSettings as ISettingsV0;

		const fmTags = {
			parse: v0.parseTags,
			prefix: removeTrailingSlash(v0.tagPrefix),
			case: v0.tagCase
		} as IFrontMatterTagSettings;

		const fm = {
			includeEmpty: v0.showEmptyProps,
			tags: fmTags,
			properties: v0.propSettings
		} as IFrontMatterSettings;

		const v1 = {
			settingsVersion: 1,
			fm: fm,
			logs: DEFAULT_SETTINGS.logs
		} as ISettings;

		return v1;
	}

	patchInDefaults() {
		if (this.settings.defaultPath === undefined)
			this.settings.defaultPath = DEFAULT_SETTINGS.defaultPath;
	}

	migrateObjToMap<K, V>(obj: { [key: string]: V; }) {
		// biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
		if (!obj.hasOwnProperty('keys')) {
			if (Object.keys(obj).length === 0)
				return new Map<K, V>();
		}
	}

	migrateSettings(settings: ISettingsV0 | ISettings): ISettings {
		// this.fixPropIdx();
		const s1 = this.migrateSettingsV0toV1(settings);
		// // @ts-ignore
		// s1.fm.properties = this.migrateObjToMap<string, IFrontMatterPropSetting>(s1.fm.properties);
		// ...more to come...
		return s1;
	}

	async loadSettings() {
		const preSettings = Object.assign({}, await this.loadData());
		// this.logger.debug("pre-migration settings", preSettings);
		this.settings = this.migrateSettings(preSettings);
		this.patchInDefaults();

		this.logger = new Logger(this);
		this.logger.debug("post-migration settings", this.settings);

		this.fmProps = createFrontMatterProps(this.settings.fm.properties);
		this.logger.debug("fmProps loaded", this.fmProps);
		await this.saveSettings();
	}

	async saveSettings() {
		this.settings.fm.tags.prefix = removeTrailingSlash(this.settings.fm.tags.prefix);
		this.settings.fm.properties = createFrontMatterPropSettings(this.fmProps);
		this.logger.debug("saving settings", this.settings);
		await this.saveData(this.settings);
	}

	displayError = (err: Error) => new Notice(`Slurp Error! ${err.message}. If this is a bug, please report it from plugin settings.`, 0);

	async slurp(url: string): Promise<void> {
		this.logger.debug("slurping", {url});
		try {
			const doc = new DOMParser().parseFromString(await fetchHtml(url), 'text/html');

			const article: IArticle = {
				slurpedTime: new Date(),
				tags: new Array<FormatterArgs>(),
				...parsePage(doc)
			};
			this.logger.debug("parsed page", article);

			// find metadata that readability doesn't pick up
			const parsedMetadata = parseMetadata(doc, this.fmProps, this.settings.fm.tags.prefix, this.settings.fm.tags.case);
			this.logger.debug("parsed metadata", parsedMetadata);

			const mergedMetadata = mergeMetadata(article, parsedMetadata);
			this.logger.debug("merged metadata", parsedMetadata);

			const md = parseMarkdown(article.content);
			this.logger.debug("converted page to markdown", md);

			await this.slurpNewNoteCallback({
				...mergedMetadata,
				content: md,
				link: url
			});
		} catch (err) {
            this.logger.error("Unable to Slurp page", {url, err: (err as Error).message});
			this.displayError(err as Error);
		}
	}

	async slurpNewNoteCallback(article: IArticle) {
		const frontMatter = createFrontMatter(article, this.fmProps, this.settings.fm.includeEmpty);
		this.logger.debug("created frontmatter", frontMatter);

		const content = `---\n${frontMatter}\n---\n\n${article.content}`;

		this.logger.debug("writing file...");
		const filePath = await getNewFilePath(this.app.vault, article.title, this.settings.defaultPath);
		const newFile = await this.app.vault.create(filePath, content);
		this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf.openFile(newFile);
	}
}
