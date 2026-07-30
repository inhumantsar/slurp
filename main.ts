import { MarkdownView, Menu, MenuItem, Notice, Plugin } from 'obsidian';
import { DEFAULT_SETTINGS } from './src/const';
import { createFrontMatter, createFrontMatterPropSettings, createFrontMatterProps } from './src/frontmatter';
import { getNewFilePath } from "./src/lib/files";
import { Logger } from './src/lib/logger';
import {
	getErrorMessage,
	parseOptionalBoolean,
	removeTrailingSlash
} from './src/lib/util';
import { SlurpNewNoteModal } from './src/modals/new-note';
import { slurpPipeline } from './src/pipeline';
import { DEFAULT_SLURP_PROCESSORS } from './src/processors';
import { DEFAULT_POST_PROCESSORS, runPostProcessors } from './src/postprocessors';
import { SlurpSettingsTab } from './src/settings';
import type {
	IArticle, IFrontMatterSettings, IFrontMatterTagSettings, ISettings, ISettingsV0, TFrontMatterProps
} from './src/types';

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
				const initialUrl = this.app.workspace.getActiveViewOfType(MarkdownView)
					?.editor?.getSelection()?.trim();
				new SlurpNewNoteModal(this.app, this, initialUrl).open();
			}
		});

		this.registerObsidianProtocolHandler("slurp", async (e) => {
			if (!e.url || e.url === "") console.error("URI is empty or undefined");

			try {
				await this.slurp(e.url, parseOptionalBoolean(e.frontmatterOnly));
			} catch (err) { this.displayError(err as Error); }
		});

		this.registerEvent(
			// @ts-expect-error -- receive-text-menu is a mobile API missing from Obsidian's public typings.
			this.app.workspace.on('receive-text-menu', (menu: Menu, shareText: string) => {
				menu.addItem((item: MenuItem) => {
					item.setTitle('Slurp');
					item.setIcon('download');
					item.onClick(() => void this.slurp(shareText));
				});
			})
		);
	}

	onunload() { }

	migrateSettingsV0toV1(loadedSettings: ISettingsV0 | ISettings): ISettings {
		// only v0 lacks the settingsVersion key
		if (Object.keys(loadedSettings).includes("settingsVersion")) return loadedSettings as ISettings;
		if (Object.keys(loadedSettings).length === 0) return DEFAULT_SETTINGS;

		const v0 = loadedSettings as ISettingsV0;

		const fmTags: IFrontMatterTagSettings = {
			parse: v0.parseTags,
			prefix: removeTrailingSlash(v0.tagPrefix),
			case: v0.tagCase
		};

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
		if (this.settings.frontmatterOnly === undefined)
			this.settings.frontmatterOnly = DEFAULT_SETTINGS.frontmatterOnly;
		this.settings.images = {
			...DEFAULT_SETTINGS.images,
			...(this.settings.images ?? {})
		};
	}

	migrateObjToMap<K, V>(obj: { [key: string]: V; }) {
		if (!Object.prototype.hasOwnProperty.call(obj, 'keys')) {
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

	displayError = (err: Error) => new Notice(`Slurp Error! ${getErrorMessage(err)}`, 0);

	async slurp(url: string, frontmatterOnlyOverride?: boolean): Promise<void> {
		try {
			const frontmatterOnly = frontmatterOnlyOverride ?? this.settings.frontmatterOnly;
			const article = await slurpPipeline(url, {
				fmProps: this.fmProps,
				tagSettings: this.settings.fm.tags,
				frontmatterOnly,
				processors: DEFAULT_SLURP_PROCESSORS
			});
			await this.slurpNewNoteCallback(article);
		} catch (err) {
			this.logger.error("Unable to Slurp page", { url, err: (err as Error).message });
			this.displayError(err as Error);
		}
	}

	async slurpNewNoteCallback(article: IArticle) {
		const filePath = await getNewFilePath(this.app.vault, article.title, this.settings.defaultPath);
		const content = await runPostProcessors(article.content, DEFAULT_POST_PROCESSORS, {
			article,
			filePath,
			createFrontMatter: () => createFrontMatter(article, this.fmProps, this.settings.fm.includeEmpty),
			settings: this.settings,
			vault: this.app.vault
		});

		this.logger.debug("writing file...");
		const newFile = await this.app.vault.create(filePath, content);
		void this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf.openFile(newFile);
	}
}
