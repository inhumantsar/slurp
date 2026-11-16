import type SlurpPlugin from "main";
import { PluginSettingTab, Setting, type App, type TAbstractFile, type TextComponent } from "obsidian";
import { FileSuggestionComponent } from "obsidian-file-suggestion-component";
import { t } from "./i18n";
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

        const saveLoc = new Setting(containerEl)
            .setName(t('defaultSaveLocation'))
            .setDesc(t('defaultSaveLocationDesc'));

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
            .setName(t('frontmatterOnly'))
            .setDesc(t('frontmatterOnlyDesc'))
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.frontmatterOnly)
                .onChange(async (val) => {
                    this.plugin.settings.frontmatterOnly = val;
                    await this.plugin.saveSettings();
                })
            );
        new Setting(containerEl).setName(t('images')).setHeading();

        const saveImagesSetting = new Setting(containerEl)
            .setName(t('saveImagesLocally'))
            .setDesc(t('saveImagesLocallyDesc'));

        let imageFolderText: TextComponent;
        new Setting(containerEl)
            .setName(t('imageFolder'))
            .setDesc(t('imageFolderDesc'))
            .addText((text) => {
                imageFolderText = text
                    .setValue(this.plugin.settings.images.folder)
                    .setPlaceholder(DEFAULT_SETTINGS.images.folder)
                    .setDisabled(!this.plugin.settings.images.saveLocally)
                    .onChange(async (val) => {
                        this.plugin.settings.images.folder = val;
                        await this.plugin.saveSettings();
                    });
            });

        saveImagesSetting.addToggle((toggle) => toggle
            .setValue(this.plugin.settings.images.saveLocally)
            .onChange(async (val) => {
                this.plugin.settings.images.saveLocally = val;
                imageFolderText.setDisabled(!val);
                await this.plugin.saveSettings();
            })
        );
        new Setting(containerEl)
            .setName(t('bannerFrontmatter'))
            .setDesc(t('bannerFrontmatterDesc'))
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.images.setBanner)
                .onChange(async (val) => {
                    this.plugin.settings.images.setBanner = val;
                    await this.plugin.saveSettings();
                })
            );


        new Setting(containerEl).setName(t('properties')).setHeading();

        new Setting(containerEl)
            .setName(t('showEmptyProperties'))
            .setDesc(t('showEmptyPropertiesDesc'))
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
                deleted.forEach((id) => this.plugin.fmProps.delete(id));
            }

            // update the rest
            props.forEach((prop) => this.plugin.fmProps.set(prop.id, prop));

            void this.plugin.saveSettings();
        };

        new FrontMatterSettings({
            target: this.containerEl, props: {
                props: Array.from(this.plugin.fmProps.values()) as FrontMatterProp[],
                onValidate: (props: FrontMatterProp[]) => onValidate(props)
            }
        });

        new Setting(containerEl).setName(t('tags')).setHeading();

        new Setting(containerEl)
            .setName(t('parseTags'))
            .setDesc(t('parseTagsDesc'))
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.fm.tags.parse)
                .onChange(async (val) => {
                    this.plugin.settings.fm.tags.parse = val;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName(t('tagPrefix'))
            .setDesc(t('tagPrefixDesc'))
            .addText((text) => text
                .setValue(this.plugin.settings.fm.tags.prefix)
                .setDisabled(!this.plugin.settings.fm.tags.parse)
                .onChange(async (val) => {
                    this.plugin.settings.fm.tags.prefix = val;
                    await this.plugin.saveSettings();
                })
            );

        new Setting(containerEl)
            .setName(t('tagCase'))
            .setDesc(t('tagCaseDesc'))
            .addDropdown((dropdown) => dropdown
                .addOptions(StringCaseOptions)
                .setValue(this.plugin.settings.fm.tags.case)
                .setDisabled(!this.plugin.settings.fm.tags.parse)
                // @ts-expect-error -- Obsidian's callback is typed as string, while these options are StringCase values.
                .onChange(async (val: StringCase) => {
                    this.plugin.settings.fm.tags.case = val;
                    await this.plugin.saveSettings();
                })
            );


        // TODO: make a component for everything below
        new Setting(containerEl)
            .setName(t('reportIssue'))
            .setHeading()
            .setDesc(t('reportIssueDesc'));

        new Setting(containerEl)
            .setName(t('debugMode'))
            .setDesc(t('debugModeDesc'))
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.logs.debug)
                .onChange(async (val) => {
                    this.plugin.settings.logs.debug = val;
                    await this.plugin.saveSettings();
                })
            );

        let recentLogsText: HTMLTextAreaElement;

        new Setting(containerEl)
            .setName(t('recentLogs'))
            .setDesc(t('recentLogsDesc'))
            .setDisabled(this.plugin.settings.logs.debug)

        if (!this.plugin.settings.logs.debug) {
            const recentLogs = containerEl.createDiv();
            recentLogs.addClass('slurp-recent-logs');

            recentLogsText = containerEl.createEl("textarea");
            recentLogsText.addClass('slurp-recent-logs-textarea');
            recentLogsText.setText(logger().dump(false, 25).content);
            recentLogs.appendChild(recentLogsText);
            containerEl.appendChild(recentLogs);
        }
    }
}
