import type { StringCase } from "./lib/string-case";

export interface IArticleTags { [s: string]: string; }

export interface IArticleMetadata {
    [property: string]: unknown;
    slurpedTime: Date;
    tags: Array<IArticleTags>;
    excerpt?: string;
    byline?: string;
    siteName?: string;
    publishedTime?: string | number;
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


export interface IFrontMatterProp {
    [index: string]: string | number | string[] | boolean | IFrontMatterPropDefaultValue | undefined | object;

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


export type IFrontMatterPropDefaultValue = unknown | (() => unknown);

export type TFrontMatterProps = Map<string, IFrontMatterProp>;
export type TFrontMatterPropDefaults = Map<string, IFrontMatterPropDefault>;

export interface IFrontMatterValidationErrors {
    hasErrors: boolean;
    format: string[];
    key: string[];
}


export interface ISettings {
    settingsVersion: number;
    defaultPath: string;
    metadataOnly: boolean;
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