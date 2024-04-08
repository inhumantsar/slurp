import { App, Editor, MarkdownView, Modal, Notice, Plugin, ProgressBarComponent, Setting, TFolder, TextComponent, htmlToMarkdown, moment, normalizePath, requestUrl, sanitizeHTMLToDom } from 'obsidian';
import { Readability } from '@mozilla/readability';

interface SlurpArticle {
	title: string;
	content: string;
	excerpt?: string;
	byline?: string;
	siteName?: string;
	publishedTime?: string;
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

export default class SlurpPlugin extends Plugin {
	readabilityScript: string;

	async onload() {
		await this.loadSettings();

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
			} catch (err) { this.errorNotice(err); }
		});
	}

	onunload() { }

	async loadSettings() { }

	async saveSettings() { }

	errorNotice = (err: Error) => new Notice(`Slurp Error! ${err.message}`);

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

	parsePage(html: string) {
		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		const article = new Readability(doc).parse();

		if (!article || !article.title || !article.content) {
			console.error(`[Slurp] Parsed article missing critical content: ${article}.`);
			throw "No title or content found.";
		}
		return article;
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
		const articleRaw = this.parsePage(html);
		await this.slurpNewNoteCallback({
			url: url,
			article: { ...articleRaw, content: this.parseMarkdown(articleRaw.content) }
		});
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

	createContent(url: string, article: SlurpArticle) {
		const fmtDt = (dt?: string, time?: boolean) => {
			return moment(dt || new Date()).format(time ? "YYYY-MM-DDTHH:mm" : "YYYY-MM-DD")
		};

		const notIfEmpty = (k: string, v?: string) => v ? `${k}: ${v}\n` : "";

		const publishedTime = article.publishedTime ? fmtDt(article.publishedTime) : undefined;

		// TODO: add toggles for properties
		let noteProps: string = "---\n";
		noteProps += `link: ${url}\n`;
		noteProps += notIfEmpty('author', article.byline);
		noteProps += notIfEmpty('date', publishedTime);
		noteProps += notIfEmpty('site', article.siteName);
		noteProps += `slurped: ${fmtDt()}\n`;
		noteProps += "---\n";
		return noteProps + article.content;
	}

	async slurpNewNoteCallback(args: SlurpCallbackArgs) {
		if (args.err) throw args.err;
		if (!args.article) throw "Article is empty.";

		const filePath = await this.createFilePath(args.article.title)
		const content = this.createContent(args.url, args.article)

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
			} catch (err) { this.plugin.errorNotice(err); }

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