import type SlurpPlugin from "main";
import { App, ButtonComponent, Modal, Setting } from "obsidian";
import { BouncingProgressBarComponent } from "../components/bouncing-progress-bar";
import { ValidatedTextComponent } from "../components/validated-text";
import { KNOWN_BROKEN_DOMAINS } from "../const";
import { extractDomain } from "../lib/util";

export class SlurpNewNoteModal extends Modal {
    private readonly plugin: SlurpPlugin;
    private readonly WARNING_CLS = "validation";
    private readonly URL_FORMAT_ERR = "Invalid URL format.";

    constructor(app: App, plugin: SlurpPlugin) {
        super(app);
        this.plugin = plugin;
    }

    private validateKnownBrokenDomains(url: string) {
        const domain = extractDomain(url) || "";
        const defaultReason = "This site is known to be incompatible with Slurp.";

        return KNOWN_BROKEN_DOMAINS.has(domain) 
            ? KNOWN_BROKEN_DOMAINS.get(domain) || defaultReason
            : null;
    }

    private validateUrlFormat(url: string) {
        return extractDomain(url) === null ? this.URL_FORMAT_ERR : null;
    }

    onOpen() {
        const { contentEl } = this;
        let slurpBtn: ButtonComponent;
        let frontmatterOnlyValue = this.plugin.settings.frontmatterOnly;

        new Setting(contentEl)
            .setName("What would you like to slurp today?")
            .setHeading();

        const urlField = new ValidatedTextComponent(contentEl)
            .setPlaceholder("https://www.somesite.com/...")
            .setMinimumLength(5)
            .addValidator((url: string) => this.validateUrlFormat(url))
            .addValidator((url: string) => this.validateKnownBrokenDomains(url))
            .onValidate((url: string, errs: string[]) => {
                slurpBtn.setDisabled(errs.length > 0 || urlField.getValue().length < 5);
            });

        urlField.inputEl.setCssProps({ "width": "100%" });

        const progressBar = new BouncingProgressBarComponent(contentEl);

        new Setting(contentEl)
            .setName("Frontmatter only")
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.frontmatterOnly)
                .onChange((value) => {
                    frontmatterOnlyValue = value;
                })
            );

        const doSlurp = () => {
            progressBar.start();
            this.plugin.slurp(urlField.getValue(), frontmatterOnlyValue);
            progressBar.stop();
            this.close();
        }

        new Setting(contentEl)
            .addButton((btn) => {
                btn.setButtonText("Slurp")
                    .setCta()
                    .setDisabled(true)
                    .onClick(doSlurp);
                slurpBtn = btn;
                return slurpBtn;
            });

        contentEl.addEventListener("keypress", (k) => (k.key === "Enter") && doSlurp());
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
