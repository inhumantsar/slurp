import type SlurpPlugin from "main";
import { PluginSettingTab, Setting, type App, type TAbstractFile } from "obsidian";
import { FileSuggestionComponent } from "obsidian-file-suggestion-component";
import FrontMatterSettings from "./components/frontmatter-prop-settings.svelte";
import { DEFAULT_SETTINGS } from "./const";
import { sortFrontMatterItems, type FrontMatterProp } from "./frontmatter";
import { Logger, logger } from "./lib/logger";
import { StringCaseOptions, type StringCase } from "./lib/string-case";
import { murmurhash3_32 } from "./lib/util";
import type { IFrontMatterProp } from "./types";

export class SlurpSettingsTab extends PluginSettingTab {
    plugin: SlurpPlugin;
    logger: Logger;

    constructor(app: App, plugin: SlurpPlugin) {
        super(app, plugin);
        this.plugin = plugin;
        this.logger = new Logger(this.plugin);
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        new Setting(containerEl).setName('General').setHeading();

        const saveLoc = new Setting(containerEl)
            .setName('Default save location')
            .setDesc("What directory should Slurp save pages to? Leave blank to save to the vault's main directory.");

        new FileSuggestionComponent(saveLoc.controlEl, this.app)
            .setValue(this.plugin.settings.defaultPath)
            .setPlaceholder(DEFAULT_SETTINGS.defaultPath)
            .setFilter("folder")
            .setLimit(10)
            .onSelect(async (val: TAbstractFile) => {
                this.plugin.settings.defaultPath = val.path;
                await this.plugin.saveSettings();
            });

        new Setting(containerEl)
            .setName('Frontmatter only')
            .setDesc("Save only frontmatter, leaving note content empty.")
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.frontmatterOnly)
                .onChange(async (val) => {
                    this.plugin.settings.frontmatterOnly = val;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl).setName('Properties').setHeading();

        new Setting(containerEl)
            .setName('Show empty properties')
            .setDesc("Should Slurp add all note properties even if they are empty?")
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.fm.includeEmpty)
                .onChange(async (val) => {
                    this.plugin.settings.fm.includeEmpty = val;
                    await this.plugin.saveSettings();
                })
            );

        // hash the original props for change detection
        const hashProps = (p: IFrontMatterProp[]) => {
            const sorted = sortFrontMatterItems(p);
            return murmurhash3_32(
                sorted.map((val) => JSON.stringify(val.getSetting())).join(""),
            );
        }
        const origPropsHash = hashProps(Array.from(this.plugin.fmProps.values()));

        const onValidate = (props: FrontMatterProp[]) => {
            const hash = hashProps(props);
            if (origPropsHash == hash) {
                this.logger.debug("onValidate called, no changes detected", {hash: hash});
                return;
            }

            this.logger.debug("onValidate called, changes detected", {hash: hash, originalHash: origPropsHash, props});

            const newPropIds = props.map((prop) => prop.id);
            const deleted = Array.from(this.plugin.fmProps.keys())
                .filter((id) => !newPropIds.contains(id));

            if (deleted.length > 0) {
                logger().warn("removing note properties", deleted);
                // biome-ignore lint/complexity/noForEach: <explanation>
                deleted.forEach((id) => this.plugin.fmProps.delete(id));
            }

            // update the rest
            // biome-ignore lint/complexity/noForEach: <explanation>
            props.forEach((prop) => this.plugin.fmProps.set(prop.id, prop));

            this.plugin.saveSettings();
        };

        new FrontMatterSettings({
            target: this.containerEl, props: {
                props: Array.from(this.plugin.fmProps.values()) as FrontMatterProp[],
                onValidate: (props: FrontMatterProp[]) => onValidate(props)
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
                .setValue(this.plugin.settings.fm.tags.parse)
                .onChange(async (val) => {
                    this.plugin.settings.fm.tags.parse = val;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Tag prefix')
            .setDesc("Apply this prefix to all tags.")
            .addText((text) => text
                .setValue(this.plugin.settings.fm.tags.prefix)
                .setDisabled(!this.plugin.settings.fm.tags.parse)
                .onChange(async (val) => {
                    this.plugin.settings.fm.tags.prefix = val;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName('Tag case')
            .setDesc("Format multi-word tags using this style. iKebab-case will replace spaces with hyphens without changing case.")
            .addDropdown((dropdown) => dropdown
                .addOptions(StringCaseOptions)
                .setValue(this.plugin.settings.fm.tags.case)
                .setDisabled(!this.plugin.settings.fm.tags.parse)
                // @ts-ignore
                .onChange(async (val: StringCase) => {
                    this.plugin.settings.fm.tags.case = val;
                    await this.plugin.saveSettings();
                })
            );


        // TODO: make a component for everything below
        new Setting(containerEl)
            .setName("Report an Issue")
            .setHeading()
            .setDesc("Visit github.com/inhumantsar/slurp/issues/new to report a bug or request a feature.");

        new Setting(containerEl)
            .setName("Debug mode")
            .setDesc("Write debug messages to console and slurp.log.")
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.logs.debug)
                .onChange(async (val) => {
                    this.plugin.settings.logs.debug = val;
                    await this.plugin.saveSettings();
                })
            );

        let recentLogsText: HTMLTextAreaElement;

        new Setting(containerEl)
            .setName("Recent Logs")
            .setDesc(
                "Copy+Paste these when opening a new GitHub issue. Not available when debug mode is enabled. " +
                "Attach the most recent log file to the GitHub issue instead."
            )
            .setDisabled(this.plugin.settings.logs.debug)

        if (!this.plugin.settings.logs.debug) {
            const recentLogs = containerEl.createDiv();
            const recentLogsStyles: Record<string, string> = {};
            recentLogsStyles["font-size"] = "small";
            recentLogs.setCssProps(recentLogsStyles);

            recentLogsText = containerEl.createEl("textarea");
            const logsTextAreaStyles: Record<string, string> = {};
            logsTextAreaStyles.width = "100%";
            logsTextAreaStyles.height = "20em";
            recentLogsText.setCssProps(logsTextAreaStyles);
            recentLogsText.setText(logger().dump(false, 25).content);
            recentLogs.appendChild(recentLogsText);
            containerEl.appendChild(recentLogs);
        }
    }
}