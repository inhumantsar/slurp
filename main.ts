import { App, Editor, MarkdownView, Modal, Notice, Plugin, ProgressBarComponent, Setting, TextComponent, htmlToMarkdown, normalizePath, requestUrl, sanitizeHTMLToDom } from 'obsidian';
import { Readability } from 'readability';

// @ts-ignore
const electron = require("electron");

interface SlurpArticle {
	title: string;
	content: string;
	excerpt?: string;
	byline?: object;
	siteName?: string;
	publishedTime?: string;
}

interface SlurpCallbackArgs {
	article?: SlurpArticle;
	err?: string;
}

export default class SlurpPlugin extends Plugin {
	readabilityScript: string;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'replace-url',
			name: 'Replace URL with article',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				const url = editor.getSelection();
				this.slurp(url, (args) => {
					if (args.err) {
						new Notice(`Error! Unable to Slurp page: ${args.err}`);
						return;
					}

					if (!args.article) {
						new Notice(`Error! Unable to Slurp page for unknown reasons.`);
						return;
					}

					// TODO: add some kind of templating or toggles for properties
					let newContent: string =  `# ${args.article.title}\n`;
					newContent += `[Original Page](${url})\n`;
					newContent += args.article.byline && `Written by: ${args.article.byline}\n` || "";
					newContent += args.article.publishedTime && `Published at: ${args.article.publishedTime}\n` || "";
					// newContent += args.article.excerpt && `${args.article.excerpt}\n` || ""; // TODO: pointless without toggles/template...
					newContent += args.article.siteName && `${args.article.siteName}\n` || "";
					newContent += "\n" + args.article.content;
					editor.replaceSelection(newContent);
				});		
			}
		});

		this.addCommand({
			id: 'create-note-from-url',
			name: 'Create note from URL',
			callback: () => {
				new SlurpNewNoteModal(this.app, this).open();
			}
		});
	}

	onunload() {

	}

	async loadSettings() {
	}

	async saveSettings() {
	}

	async slurp(url: string, cb: (args: SlurpCallbackArgs) => void) {
		const text = await requestUrl(url).text;
		const doc = sanitizeHTMLToDom(text);
		const article = new Readability(doc).parse();

		if (!article || !article.title || !article.content) {
			console.error(`[Slurp] Parsed article missing critical content: ${article}.`);
			cb({err: "No title or content found."});
			return;
		}

		const md = htmlToMarkdown(sanitizeHTMLToDom(article.content));
		if (!md) {
			console.error(`[Slurp] Parsed content resulted in falsey markdown: ${md}`);
			cb({err: "Unable to convert content to Markdown."});
		}

		let slurpArticle: SlurpArticle = {
			title: article.title,
			content: md,
		};

		if (article.excerpt) slurpArticle.excerpt = article.excerpt;
		if (article.byline) slurpArticle.byline = article.byline;
		if (article.siteName) slurpArticle.siteName = article.siteName;
		if (article.publishedTime) slurpArticle.publishedTime = article.publishedTime;

		cb({article: slurpArticle});
	}
}

class SlurpNewNoteModal extends Modal {
	plugin: SlurpPlugin;
	url: string;
  
	constructor(app: App, plugin: SlurpPlugin) {
		super(app);
		this.plugin = plugin;
	}

	async callback(args: SlurpCallbackArgs) {
		if (args.err) {
			new Notice(`Error! Unable to Slurp page: ${args.err}`);
			return;
		}

		if (!args.article) {
			new Notice(`Error! Unable to Slurp page for unknown reasons.`);
			return;
		}

		const fileName = args.article.title;

		// TODO: add setting for slurped pages folder
		let folder = this.app.vault.getFolderByPath("Slurped Pages");
		if (!folder) {
			folder = await this.app.vault.createFolder("Slurped Pages");
		}

		const filePath = normalizePath(`${folder.path}/${fileName}.md`);
		if (this.app.vault.getFileByPath(filePath)) {
			new Notice("Slurp: A file with that name already exists!");
			return;
		}
		
		// TODO: add toggles for properties
		let noteProps: string = "---\n";
		noteProps += `link: ${this.url}\n`;
		noteProps += args.article.byline && `author: ${args.article.byline}\n` || "";

		if (args.article.publishedTime) {
			// TODO: find a way to get the user's system date time format 
			const utcDate = new Date(args.article.publishedTime);
			const localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
			noteProps += `date: ${localDate.toISOString().slice(0, 10)}\n`;
			noteProps += `time: ${localDate.toISOString().slice(0, 19)}\n`;
			noteProps += `timestamp: ${Math.floor(utcDate.getTime() / 1000)}\n`;
		}

		// TODO: pointless without toggles/template...
		// newContent += args.article.excerpt && `${args.article.excerpt}\n` || "";

		noteProps += args.article.siteName && `site: ${args.article.siteName}\n` || "";
		noteProps += "slurped: true\n";
		noteProps += "---\n";

		const newFile = await this.app.vault.create(filePath, noteProps + args.article.content);
		this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf.openFile(newFile);
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h3", { text: "What would you like to slurp today?"})

		const urlField = new TextComponent(contentEl)
			.setPlaceholder("URL")
			.onChange((val) => this.url = val);
		urlField.inputEl.setCssProps({"width": "100%"});

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
			
			this.plugin.slurp(this.url, (args) => this.callback(args).then(() => {
				clearInterval(t);
				this.close();	
			}));
		}

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