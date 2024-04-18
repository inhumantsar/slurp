import { Readability } from '@mozilla/readability';
import { DEFAULT_SETTINGS, DEFAULT_SLURP_PROPS } from './const';
import { App, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, ProgressBarComponent, Setting, TextComponent, htmlToMarkdown, moment, normalizePath, requestUrl, sanitizeHTMLToDom, stringifyYaml } from 'obsidian';
import type { SlurpArticle, ISlurpMetadata, SlurpProps, SlurpSettings, TagCase, IFormatterArgs } from 'types';
import { SlurpProp, TAG_CASES } from 'types';
import NotePropSettingList from "./NotePropSettingList.svelte";
import { createFilePath, isEmpty, sortSlurpProps } from './util';
import { format, formatString } from 'formatters';
import { dump } from 'js-yaml';
import { Pair, stringify } from 'yaml';

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

	fixRelativeLinks(html: string, articleUrl: string) {
		const url = new URL(articleUrl);

		return html
			// Handles absolute paths
			.replace(/(href|src)="\/([^\/].*?)"/g, `$1="${url.origin}/$2"`)
			// Handles relative paths
			.replace(/(href|src)="([^\/].*?)"/g, (match, p1, p2) => {
				// Check if it's a protocol-relative URL (starts with //) or has a protocol
				if (/^\/\//.test(p2) || /^[a-z][a-z0-9+.-]*:/.test(p2)) {
					return match; // return original if it's protocol-relative or has a protocol
				}
				return `${p1}="${new URL(p2, url.href)}"`;
			});
	}

	async fetchHtml(url: string) {
		const html = await requestUrl(url).text;
		if (!html) {
			console.error(`[Slurp] Unable to fetch page from: ${url}.`);
			throw `Unable to fetch page.`;
		}
		return this.fixRelativeLinks(html, url)
	}

	parsePage(doc: Document) {
		const article = new Readability(doc).parse();

		if (!article || !article.title || !article.content) {
			console.error(`[Slurp] Parsed article missing critical content: ${article}.`);
			throw "No title or content found.";
		}
		return article;
	}

	updateStringCase(text: string) {
		switch (this.settings.tagCase) {
			case "PascalCase":
				return text.replace(/ ./g, (str) => str.trim().toUpperCase()).replace(/^./, (str) => str.toUpperCase());
			case "camelCase":
				return text.replace(/ ./g, (str) => str.trim().toUpperCase()).replace(/^./, (str) => str.toLowerCase());
			case "snake_case":
				return text.replace(/ /g, '_').toLowerCase();
			case "kebab-case":
				return text.replace(/ /g, '-').toLowerCase();
			default:
				return text.replace(/ /g, '-');
		}
	}

	parseMetadataTags(elements: NodeListOf<HTMLMetaElement>) {
		// Tags need to be split and reformatted:
		//   - Must be alphanumeric (not numeric)
		//	 - May contain underscores or hyphens
		//   - Nested tags are separated by forward slashes (/)
		//	 - Tags are case-insensitive 
		const tags = new Set<IFormatterArgs>();
		elements.forEach((e) => e.content
			.split(",")
			.forEach((text) => tags.add({ prefix: this.settings.tagPrefix, tag: this.updateStringCase(text.trim()) })));
		console.debug(tags);
		return tags;
	}

	parseMetadata(doc: Document): ISlurpMetadata {
		const metadata: ISlurpMetadata = { tags: new Set<IFormatterArgs>(), slurpedTime: new Date() };
		const tmpl = 'meta[name="{s}"], meta[property="{s}"], meta[itemprop="{s}"], meta[http-equiv="{s}"]';

		for (let i in this.slurpProps) {
			const prop = this.slurpProps[i];

			const metaFields = new Set([...prop.metaFields || [], ...prop.extraMetaFields || []]);

			metaFields.forEach((attr) => {
				// tags need special handling, for everything else we just take the first result
				if (prop.id == "tags") {
					const elements: NodeListOf<HTMLMetaElement> = doc.querySelectorAll(formatString(tmpl, attr));
					this.parseMetadataTags(elements).forEach((val) => metadata.tags.add(val));
				} else {
					// @ts-ignore
					if (metadata[prop.id] != undefined) return;
					const elements: NodeListOf<HTMLMetaElement> = doc.querySelectorAll(formatString(tmpl, attr));
					if (elements.length == 0) return;

					// @ts-ignore
					metadata[prop.id] = elements[0].content;
				}
			});
		};

		return metadata;
	}

	mergeMetadata(article: SlurpArticle, metadata: ISlurpMetadata): SlurpArticle {
		const merged = { ...article };

		// handle tags separately
		merged.tags = new Set([...article.tags, ...metadata.tags]);

		// Iterate over the keys of objB
		for (const key in metadata) {
			// @ts-ignore
			if (key !== 'tags' && isEmpty(merged[key]) && !isEmpty(metadata[key])) merged[key] = metadata[key];
		}

		return merged;
	}

	parseMarkdown(content: string): string {
		const md = htmlToMarkdown(sanitizeHTMLToDom(content));
		if (!md) {
			console.error(`[Slurp] Parsed content resulted in falsey markdown: ${md}`);
			throw "Unable to convert content to Markdown.";
		}
		return md;
	}

	async slurp(url: string): Promise<void> {
		const html = await this.fetchHtml(url);
		const doc = new DOMParser().parseFromString(html, 'text/html');
		const article: SlurpArticle = { slurpedTime: new Date(), tags: new Set<IFormatterArgs>(), ...this.parsePage(doc) };
		const metadata = this.mergeMetadata(article, this.parseMetadata(doc));
		const content = this.parseMarkdown(article.content);
		await this.slurpNewNoteCallback({ ...metadata, content: content, link: url });
	}

	getFrontMatterValue(prop: SlurpProp<any>, article: SlurpArticle, showEmpty: boolean) {
		if (isEmpty(article[prop.id]) && prop.defaultValue !== undefined)
			return typeof prop.defaultValue === "function"
				? prop.defaultValue()
				: prop.defaultValue;

		if (!isEmpty(article[prop.id]) || this.settings.showEmptyProps) {
			const r = prop.format ? format(prop.format, article[prop.id]) : article[prop.id];
			return r
		}
	}


	getFrontMatterYaml(fm: Map<string, any>, idx: Map<string, number>) {
		const fmObj = Object.fromEntries(fm);
		console.log('created frontmatter obj', fmObj);
		const yamlSort = (a: Pair, b: Pair) => (idx.get(a.key as string) || 0) - (idx.get(b.key as string) || 0);
		const yamlstr = stringify(fmObj, { sortMapEntries: yamlSort }).trim();
		console.log(yamlstr);
		return yamlstr;
	}

	createFrontMatter(article: SlurpArticle): string | undefined {
		const fm = new Map<string, any>();
		// js-yaml will want to sort by key not by id
		const keyIndex = new Map<string, number>();

		for (let i in this.slurpProps) {
			const prop = this.slurpProps[i];
			if (!prop.enabled) continue;

			const val = this.getFrontMatterValue(prop, article, this.settings.showEmptyProps);
			if (prop.key == "mykey") console.log(`adding mykey val ${val} (${typeof val}) to fm map`);
			fm.set(prop.key, val);

			keyIndex.set(prop.key, prop.idx);
		};

		return this.getFrontMatterYaml(fm, keyIndex);
	}

	async slurpNewNoteCallback(article: SlurpArticle) {
		const filePath = await createFilePath(this.app.vault, article.title);
		const content = `---\n${this.createFrontMatter(article)}\n---\n${article.content}`;

		const newFile = await this.app.vault.create(filePath, content);
		this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf.openFile(newFile);
	}
}

class SlurpNewNoteModal extends Modal {
	plugin: SlurpPlugin;
	url: string;

	constructor(app: App, plugin: SlurpPlugin) {
		super(app);
		this.plugin = plugin;
		this.url = "";
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h3", { text: "What would you like to slurp today?" })

		const urlField = new TextComponent(contentEl)
			.setPlaceholder("URL")
			.onChange((val) => this.url = val);
		urlField.inputEl.setCssProps({ "width": "100%" });

		const progressBar = new ProgressBarComponent(contentEl)
		progressBar.disabled = true;
		progressBar.setValue(0);

		const doSlurp = async () => {
			urlField.setDisabled(true);
			progressBar.setDisabled(false);
			let progressIncrement = 1;

			const t = setInterval(() => {
				const cur = progressBar.getValue();
				if (cur == 100) progressIncrement *= -1;
				progressBar.setValue(cur + progressIncrement);
			}, 10)

			try {
				this.plugin.slurp(this.url);
			} catch (err) { this.plugin.displayError(err as Error); }

			clearInterval(t);
			this.close();
		};

		new Setting(contentEl)
			.addButton((btn) => btn
				.setButtonText("Slurp")
				.setCta()
				.onClick(doSlurp))

		contentEl.addEventListener("keypress", (k) => (k.key === "Enter") && doSlurp());
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SlurpSettingsTab extends PluginSettingTab {
	plugin: SlurpPlugin;

	constructor(app: App, plugin: SlurpPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {

		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName('Properties').setHeading();

		new Setting(containerEl)
			.setName('Show empty properties')
			.setDesc("Should Slurp add all note properties even if they are empty?")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.showEmptyProps)
				.onChange(async (val) => {
					this.plugin.settings.showEmptyProps = val;
					await this.plugin.saveSettings();
				})
			);

		const onValidate = (props: SlurpProp<any>[]) => {
			console.log("onValidate called");
			console.log(props);
			// update existing
			const modKeys = props.map((prop) => {
				//Object.keys(prop).forEach((key) => console.log(`new: ${prop[key]}, curr: ${this.plugin.slurpProps[prop.id][key]}`));
				this.plugin.slurpProps[prop.id] = prop
				return prop.id;
			});

			// delete keys no longer present
			Object.keys(this.plugin.slurpProps).map((id) => modKeys
				.contains(id) ? null : id).filter((id) => id !== null).map((id) => {
					if (id) {
						delete this.plugin.settings.propSettings[id];
						delete this.plugin.slurpProps[id];
					}
				});

			this.plugin.saveSettings();
		}

		new NotePropSettingList({
			target: this.containerEl, props: {
				props: Object.values<SlurpProp<any>>(
					SlurpProp.fromSettings(this.plugin.settings.propSettings, DEFAULT_SLURP_PROPS)),
				onValidate: (props: SlurpProp<any>[]) => onValidate(props)
			}
		});

		new Setting(containerEl).setName('Tags').setHeading();

		new Setting(containerEl)
			.setName('Parse tags')
			.setDesc("Use the tags and keywords discovered in slurped page metadata? " +
				"WARNING: May result in a large number of new tags, prefixes are highly recommended. " +
				"Some sites put entire sentences into the fields meant for comma-separated keywords. " +
				"Yes, abc7news.com, I'm talking about you. ")
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.parseTags)
				.onChange(async (val) => {
					this.plugin.settings.parseTags = val;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName('Tag prefix')
			.setDesc("Apply this prefix to all tags.")
			.addText((text) => text
				.setValue(this.plugin.settings.tagPrefix)
				.setDisabled(!this.plugin.settings.parseTags)
				.onChange(async (val) => {
					this.plugin.settings.tagPrefix = val;
					await this.plugin.saveSettings();
				})
			);

		const tagCaseOptions: Record<TagCase, TagCase> = TAG_CASES.reduce((acc, cur) => {
			acc[cur] = cur;
			return acc;
		}, {} as Record<TagCase, TagCase>);

		new Setting(containerEl)
			.setName('Tag case')
			.setDesc("Format multi-word tags using this style. iKebab-case will replace spaces with hyphens without changing case.")
			.addDropdown((dropdown) => dropdown
				.addOptions(tagCaseOptions)
				.setValue(this.plugin.settings.tagCase)
				.setDisabled(!this.plugin.settings.parseTags)
				// @ts-ignore
				.onChange(async (val: TagCase) => {
					this.plugin.settings.tagCase = val;
					await this.plugin.saveSettings();
				})
			);

		// new Setting(containerEl).setName('Advanced').setHeading();
		// new Setting(containerEl)
		// 	.setName("Debug mode")
		// 	.setDesc("Write debug messages to console and slurp.log.")
		// 	.addToggle((toggle) => toggle
		// 		.setValue(this.plugin.settings.debug)
		// 		.onChange(async (val) => {
		// 			this.plugin.settings.debug = val;
		// 			await this.plugin.saveSettings();
		// 		})
		// 	);
	}
}