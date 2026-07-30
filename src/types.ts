import type SlurpPlugin from "../main";
import type { StringCase } from "./lib/string-case";

export interface IArticleTags { [s: string]: string; }

export interface IArticleMetadata {
    [property: string]: unknown;
    slurpedTime: Date;
    tags: Array<IArticleTags>;
    excerpt?: string | null;
    byline?: string | null;
    siteName?: string | null;
    publishedTime?: string | number | null;
    modifiedTime?: string | number;
    type?: string;
    twitter?: string;
    onion?: string;
    link?: string;
}

export interface IArticle extends IArticleMetadata {
    [property: string]: unknown;
    title: string;
    content: string;
}

export interface IReadabilityArticle {
    title?: string;
    content?: string;
    textContent?: string;
    length?: number;
    excerpt?: string;
    byline?: string;
    dir?: string;
    siteName?: string;
    lang?: string;
    publishedTime?: string;
}

export interface SlurpCallbackArgs {
    url: string;
    article?: IArticle;
    err?: string;
}

// overkill atm but hey
export interface SlurpUrlParams {
    url: string;
}

export interface FormatterArgs { [s: string]: string; }



export interface ISlurpProcessorContext {
    readonly url: string;
}

export interface ISlurpProcessor<T> {
    readonly id: string;
    process(value: T, context: ISlurpProcessorContext): T | Promise<T>;
}

export interface ISlurpProcessors {
    readonly document: readonly ISlurpProcessor<Document>[];
    readonly article: readonly ISlurpProcessor<IArticle>[];
    readonly markdown: readonly ISlurpProcessor<string>[];
}

export interface ISlurpPipelineOptions {
    readonly fmProps: TFrontMatterProps;
    readonly tagSettings: IFrontMatterTagSettings;
    readonly frontmatterOnly: boolean;
    readonly processors: ISlurpProcessors;
}
export interface IPostProcessorContext {
    readonly article: IArticle;
    readonly filePath: string;
    readonly plugin: SlurpPlugin;
}

export interface IPostProcessor {
    readonly id: string;
    process(markdown: string, context: IPostProcessorContext): string | Promise<string>;
}


export interface IFrontMatterProp {
    [index: string]: unknown;

    id: string;
    enabled: boolean;
    key: string;
    idx: number;
    custom: boolean;
    format?: string;
    defaultIdx?: number;
    defaultKey?: string;
    description?: string;
    metaFields?: string[];
    defaultFormat?: string;
    defaultValue?: IFrontMatterPropDefaultValue;

    getSetting: () => IFrontMatterPropSetting;
}

export interface IFrontMatterPropDefault {
    id: string;
    defaultIdx: number;
    defaultKey: string;
    description: string;
    metaFields?: string[];
    defaultFormat?: string;
    defaultValue?: IFrontMatterPropDefaultValue;
}


export type IFrontMatterPropDefaultValue = unknown;

export type TFrontMatterProps = Map<string, IFrontMatterProp>;
export type TFrontMatterPropDefaults = Map<string, IFrontMatterPropDefault>;

export interface IFrontMatterValidationErrors {
    hasErrors: boolean;
    format: string[];
    key: string[];
}


export interface IImageSettings {
    saveLocally: boolean;
    folder: string;
    setBanner: boolean;
}

export interface ISettings {
    settingsVersion: number;
    defaultPath: string;
    frontmatterOnly: boolean;
    images: IImageSettings;
    fm: IFrontMatterSettings;
    logs: ILogSettings;
}

export interface ILogSettings {
    debug: boolean;
    logPath: string;
}

export interface IFrontMatterTagSettings {
    parse: boolean;
    prefix: string;
    case: StringCase;
}

export interface IFrontMatterSettings {
    includeEmpty: boolean;
    tags: IFrontMatterTagSettings;
    properties: IFrontMatterPropSettings;
}

export interface IFrontMatterPropSetting {
    id: string;
    custom: boolean;
    enabled: boolean;
    key?: string;
    idx?: number;
    format?: string;
}

export interface IFrontMatterPropSettings { [s: string]: IFrontMatterPropSetting; }

//////////////////////////////////////////////////////////////////////////
// ye olde interfaces

export interface ISettingsV0 {
    showEmptyProps: boolean;
    parseTags: boolean;
    tagPrefix: string;
    tagCase: StringCase;
    propSettings: IFrontMatterPropSettingsV0;
    debug: boolean;
}


export interface IFrontMatterPropSettingV0 {
    id: string;
    enabled?: boolean;
    key?: string;
    idx?: number;
    format?: string;
    custom: boolean;
}

export type IFrontMatterPropSettingsV0 = { [s: string]: IFrontMatterPropSettingV0; };
