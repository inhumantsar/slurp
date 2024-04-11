import { App, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, ProgressBarComponent, Setting, TextComponent, htmlToMarkdown, moment, normalizePath, requestUrl, sanitizeHTMLToDom } from 'obsidian';
import { Readability } from '@mozilla/readability';

interface SlurpArticleMetadata {
	tags: Set<string>;
	excerpt?: string;
	byline?: string;
	siteName?: string;
	publishedTime?: string;
	modifiedTime?: string;
	type?: string;
	twitter?: string;
	onion?: string;
	link?: string;
}

interface SlurpArticle extends SlurpArticleMetadata {
	title: string;
	content: string;
}

interface SlurpCallbackArgs {
	url: string;
	article?: SlurpArticle;
	err?: string;
}

// overkill atm but hey
interface SlurpUrlParams {
	url: string
}

const TAG_CASES = ["camelCase", "PascalCase", "snake_case", "kebab-case", "iKebab-case"] as const;
type TagCase = typeof TAG_CASES[number];

interface SlurpSettings {
	showEmptyProps: boolean
	parseTags: boolean
	tagPrefix: string
	tagCase: TagCase
}

const DEFAULT_SETTINGS: SlurpSettings = {
	showEmptyProps: false,
	parseTags: true,
	tagPrefix: "slurp/",
	tagCase: "iKebab-case"
}

function isEmpty(val: any): boolean {
	return val == null || (typeof val === 'string' && val.trim() === '') || (Array.isArray(val) && val.length === 0);
}

// maps the attribute names in <meta> elements to slurp metadata fields in order of priority
const META_FIELDS = new Map<string, Set<string>>([
	['excerpt', new Set(['description', 'og:description', 'twitter:description'])],
	['byline', new Set(['author', 'article:author', 'parsely-author', 'cXenseParse:author'])], // article:author is a think, but seems mostly for bio URLs
	['title', new Set(['title', 'og:title', 'parsely-title', 'twitter:title', 'twitter:text:title'])],
	['siteName', new Set(['og:site_name', 'page.content.source', 'application-name', 'apple-mobile-web-app-title', 'twitter:site'])],
	['publishedTime', new Set(['article:published_time', 'parsely-pub-date', 'datePublished', 'article.published'])],
	['modifiedTime', new Set(['article:modified_time', 'dateModified', 'dateLastPubbed'])],
	['link', new Set(['url', 'og:url', 'parsely-link', 'twitter:url'])],
	['type', new Set(['og:type', 'parsely-type', 'medium', 'page.content.type'])],
	['twitter', new Set(['twitter:creator', 'twitter:site'])],
	['tags', new Set(['tags', 'keywords', 'article:tag', 'parsely-tags', 'news_keywords'])],
	['onion', new Set(['onion-location'])] // http-equiv
]);

export default class SlurpPlugin extends Plugin {
	settings: SlurpSettings;

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
			} catch (err) { this.displayError(err); }
		});
	}

	onunload() { }

	async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }

	async saveSettings() { await this.saveData(this.settings); }

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
		const tags = new Set<string>();
		elements.forEach((e) => e.content
			.split(",")
			.forEach((text) => {
				const tag = this.settings.tagPrefix + this.updateStringCase(text);
				if (isFinite(+tag)) {
					console.error(`[Slurp] Unable to use parsed tag, the result is numeric: ${tag}`);
					return;
				}
				tags.add(tag);
			}));
		console.debug(`Found tags: ${tags}`);
		return tags;
	}

	parseMetadata(doc: Document) {
		const metadata: SlurpArticleMetadata = { tags: new Set() };
		const tmpl = 'meta[name="{attr}"], meta[property="{attr}"], meta[itemprop="{attr}"], meta[http-equiv="{attr}"]';

		META_FIELDS.forEach((attrs, k) => {
			attrs.forEach((attr) => {
				// tags need special handling, for everything else we just take the first result
				if (k == "tags") {
					const elements: NodeListOf<HTMLMetaElement> = doc.querySelectorAll(tmpl.replace('{attr}', attr));
					metadata.tags = new Set<string>([...metadata.tags, ...this.parseMetadataTags(elements)]);
				} else {
					// @ts-ignore
					if (metadata[k] != undefined) return;
					const elements: NodeListOf<HTMLMetaElement> = doc.querySelectorAll(tmpl.replace('{attr}', attr));
					if (elements.length == 0) return;

					// @ts-ignore
					metadata[k] = elements[0].content;
				}
			});
		});

		return metadata;
	}

	mergeMetadata(article: SlurpArticle, metadata: SlurpArticleMetadata): SlurpArticle {
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

	parseMarkdown(content: string) {
		const md = htmlToMarkdown(sanitizeHTMLToDom(content));
		if (!md) {
			console.error(`[Slurp] Parsed content resulted in falsey markdown: ${md}`);
			throw "Unable to convert content to Markdown.";
		}
		return md;
	}

	async slurp(url: string) {
		const html = await this.fetchHtml(url);
		const doc = new DOMParser().parseFromString(html, 'text/html');
		const article: SlurpArticle = { tags: new Set<string>(), ...this.parsePage(doc) };
		const metadata = this.mergeMetadata(article, this.parseMetadata(doc));
		const content = this.parseMarkdown(article.content);
		await this.slurpNewNoteCallback({ ...metadata, content: content, link: url });
	}

	async createFilePath(title: string) {
		// increment suffix on duplicated file names... to a point.
		const fpLoop = (p: string, fn: string, retries: number): string => {
			if (retries == 100) throw "Cowardly refusing to increment past 100.";
			const suffix = retries > 0 ? `-${retries}.md` : '.md';
			const fp = normalizePath(`${p}/${fn}${suffix}`);
			return this.app.vault.getFileByPath(fp) ? fpLoop(p, fn, retries + 1) : fp
		}

		// TODO: add setting for slurped pages folder
		const folder = this.app.vault.getFolderByPath("Slurped Pages") ||
			await this.app.vault.createFolder("Slurped Pages");

		const fileName = title.replace(/[\\\/:]/g, '-');

		return fpLoop(folder.path, fileName, 0);
	}

	createContent(article: SlurpArticle) {
		// TODO: replace hardcoded string with a template or add settings for toggles + custom props + ordering?
		const fmtDt = (dt?: string) => {
			return moment(dt || new Date()).format("YYYY-MM-DDTHH:mm")
		};

		const maybe = (k: string, v?: string) => {
			if (!isEmpty(v) || this.settings.showEmptyProps) return `${k}: ${v || ""}\n`;
			else return "";
		}

		const fmtList = (arr?: Array<string> | Set<string>) => {
			if (!arr) return undefined;
			let ret = "";
			arr.forEach((val) => ret = `${ret}\n  - ${val}`);
			return ret;
		}

		const publishedTime = article.publishedTime ? fmtDt(article.publishedTime) : undefined;
		const modifiedTime = article.modifiedTime ? fmtDt(article.modifiedTime) : undefined;
		const twitter = article.twitter ? `https://twitter.com/${article.twitter.substring(1)}` : undefined;
		// tags: Set<string>;


		let noteProps: string = "---\n";
		noteProps += `link: ${article.link}\n`;
		noteProps += maybe('author', article.byline);
		noteProps += maybe('date', publishedTime);
		noteProps += maybe('modified', modifiedTime);
		noteProps += maybe('site', article.siteName);
		noteProps += maybe('type', article.type);
		noteProps += maybe('excerpt', article.excerpt);
		noteProps += maybe('twitter', twitter);
		noteProps += maybe('onion', article.onion);
		noteProps += maybe('tags', fmtList(article.tags));
		noteProps += `slurped: ${fmtDt()}\n`;
		noteProps += "---\n";
		return noteProps + article.content;
	}

	async slurpNewNoteCallback(article: SlurpArticle) {
		const filePath = await this.createFilePath(article.title)
		const content = this.createContent(article)

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
			} catch (err) { this.plugin.displayError(err); }

			clearInterval(t);
			this.close();
		};

		new Setting(contentEl)
			.addButton((btn) => btn
				.setButtonText("Slurp")
				.setCta()
				.onClick(doSlurp)
			)

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
				.onChange(async (val: TagCase) => {
					this.plugin.settings.tagCase = val;
					await this.plugin.saveSettings();
				})
			);
	}
}