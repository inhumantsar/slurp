import type SlurpPlugin from "main";
import { PluginSettingTab, App, Setting } from "obsidian";
import FrontMatterSettings from "src/components/NotePropSettings.svelte";
import { DEFAULT_SLURP_PROPS } from "src/const";
import { SlurpProp } from "src/slurp-prop";
import { StringCaseOptions, type StringCase } from "./string-case";

export class SlurpSettingsTab extends PluginSettingTab {
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

        new FrontMatterSettings({
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

        new Setting(containerEl)
            .setName('Tag case')
            .setDesc("Format multi-word tags using this style. iKebab-case will replace spaces with hyphens without changing case.")
            .addDropdown((dropdown) => dropdown
                .addOptions(StringCaseOptions)
                .setValue(this.plugin.settings.tagCase)
                .setDisabled(!this.plugin.settings.parseTags)
                // @ts-ignore
                .onChange(async (val: StringCase) => {
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