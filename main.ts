import { App, ButtonComponent, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, ProgressBarComponent, Setting, TextComponent, Vault, htmlToMarkdown, normalizePath } from 'obsidian';

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

		// load readability script... in the sketchiest way possible :(
		await this.loadScript();

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
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SlurpNewNoteModal(this.app, this).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});
	}

	onunload() {

	}

	async loadSettings() {
	}

	async saveSettings() {
	}

	async loadScript() {
		// TODO: check content hash and use specific commit in the url, add both to settings.
		await fetch("https://raw.githubusercontent.com/mozilla/readability/main/Readability.js").then(async (resp) => {
			this.readabilityScript = await resp.text();
		}).catch(err => console.error(`Unable to load Readability: ${err}`));
	}

	async slurp(url: string, cb: (args: SlurpCallbackArgs) => void) {
		const win = new electron.remote.BrowserWindow({ show: false });

		win.loadURL(url).then(async () => {
			// attempt to load the script again if it wasn't loaded at startup
			if (!this.readabilityScript) {
				await this.loadScript();
			}
			
			// TODO: sanitize. it's sandboxed in the electron child window and all inputs will be from pages 
			// 		 that the user has already loaded in their browser, so it should be safe enough for now.
			//		 it wouldn't be the first time that i was wrong and dumb though!
			const parseScript = this.readabilityScript + `
				var article = new Readability(document).parse(); 
				article;
			`;

			// inject Readability and extract content after the page has loaded
			win.webContents.executeJavaScript(parseScript)
				.then((article: any) => {
					if (!article || !article.title || !article.content) {
						console.error(`[Slurp] Parsed article missing critical content: ${article}.`);
						cb({err: "No title or content found."});
						return;
					}

					const md = htmlToMarkdown(article.content);
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
					win.close();
				})
				.catch((err: any) => console.error(`[Slurp] Failed to parse page: ${err}`));
			});
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

		this.app.vault.create(filePath, noteProps + args.article.content)
			.then((newFile) => this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf.openFile(newFile));
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