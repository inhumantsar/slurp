import type SlurpPlugin from "main";
import { Modal, App, TextComponent, ProgressBarComponent, Setting } from "obsidian";

export class SlurpNewNoteModal extends Modal {
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
