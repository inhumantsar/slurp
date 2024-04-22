import type SlurpPlugin from "main";
import { App, PluginSettingTab, Setting, ValueComponent } from "obsidian";
import FrontMatterSettings from "./components/NotePropSettings.svelte";
import { FrontMatterProp } from "./frontmatter";
import { Logger, logger } from "./logger";
import { StringCaseOptions, type StringCase } from "./string-case";
import { DEFAULT_SETTINGS } from "./const";

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
        this.app.workspace
        new Setting(containerEl)
            .setName('Default save location')
            .setDesc("What directory should Slurp save pages to? Leave blank to save to the vault's main directory.")
            .addText((text) => text
                .setValue(this.plugin.settings.defaultPath)
                .setPlaceholder(DEFAULT_SETTINGS.defaultPath)
                .onChange(async (val) => {
                    this.plugin.settings.defaultPath = val;
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

        const onValidate = (props: FrontMatterProp[]) => {
            this.logger.debug("onValidate called", props);
            // update existing
            const modKeys = props.map((prop) => {
                this.plugin.fmProps.set(prop.id, prop);
                return prop.id;
            });

            // delete keys no longer present
            Object.keys(this.plugin.fmProps).map((id) => modKeys
                .contains(id) ? null : id).filter((id) => id !== null).map((id) => {
                    if (id) {
                        delete this.plugin.settings.fm.properties[id];
                        this.plugin.fmProps.delete(id);
                    }
                });

            this.plugin.saveSettings();
        }

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


        new Setting(containerEl)
            .setName("Report an Issue")
            .setHeading();

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

        new Setting(containerEl)
            .setName("Recent Logs")
            .setDesc(
                "Copy+Paste these when opening a new GitHub issue. Not available when debug mode is enabled. " +
                "Submit the most recent log file instead"
            )
            .setDisabled(!this.plugin.settings.logs.debug);

        if (!this.plugin.settings.logs.debug) {
            const recentLogs = containerEl.createDiv();
            const recentLogsStyles: Record<string, string> = {};
            recentLogsStyles["font-size"] = "small";
            recentLogs.setCssProps(recentLogsStyles);

            const logsTextArea = containerEl.createEl("textarea");
            logsTextArea.setText(logger().dump(false, 25).content);
            const logsTextAreaStyles: Record<string, string> = {};
            logsTextAreaStyles["width"] = "100%";
            logsTextAreaStyles["height"] = "20em";
            logsTextArea.setCssProps(logsTextAreaStyles);
            recentLogs.appendChild(logsTextArea);
            containerEl.appendChild(recentLogs);
        }

        const githubOuter = containerEl.createDiv();
        const githubPara = containerEl.createEl("p");
        const githubParaStyles: Record<string, string> = {};
        githubParaStyles["font-size"] = "normal";
        githubParaStyles["text-align"] = "center";
        githubPara.setCssProps(githubParaStyles);

        const gitHubLink = containerEl.createSpan();
        gitHubLink.addClass("external-link");
        gitHubLink.setText('https://github.com/inhumantsar/slurp/issues/new?labels=bug');
        githubPara.appendChild(gitHubLink);
        githubOuter.appendChild(githubPara);
        containerEl.appendChild(githubOuter);
    }
}