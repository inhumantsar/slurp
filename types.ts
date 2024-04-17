import type { Invalidator, Subscriber, Unsubscriber, Updater } from "svelte/store"

export interface SlurpSettings {
    showEmptyProps: boolean
    parseTags: boolean
    tagPrefix: string
    tagCase: TagCase
    propSettings: SlurpPropSettings
    debug: boolean
}

export interface ISlurpMetadata {
    slurpedTime: Date;
    tags: Set<IFormatterArgs>;
    excerpt?: string;
    byline?: string;
    siteName?: string;
    publishedTime?: string;
    modifiedTime?: string;
    type?: string;
    twitter?: string;
    onion?: string;
    link?: string;
}

export interface SlurpArticle extends ISlurpMetadata {
    [property: string]: any;
    title: string;
    content: string;
}

export interface SlurpCallbackArgs {
    url: string;
    article?: SlurpArticle;
    err?: string;
}

// overkill atm but hey
export interface SlurpUrlParams {
    url: string
}
export interface ISlurpPropStore {
    subscribe: (this: void, run: Subscriber<SlurpProps>, invalidate?: Invalidator<SlurpProps> | undefined) => Unsubscriber
    set: (this: void, value: SlurpProps) => void
    update: (modified: SlurpProps) => void
    errs: (this: void, run: Subscriber<string[]>, invalidate?: Invalidator<string[]> | undefined) => Unsubscriber
}

export const TAG_CASES = ["camelCase", "PascalCase", "snake_case", "kebab-case", "iKebab-case"] as const;
export type TagCase = typeof TAG_CASES[number];

export interface IFormatterArgs { [s: string]: string }

export type DefaultFunction<T> = () => T;

export interface ISlurpProp<T> {
    id: string;
    enabled?: boolean;
    key?: string;
    idx?: number;
    format?: string;
    defaultIdx?: number;
    defaultKey?: string;
    description?: string;
    metaFields?: string[];
    custom: boolean;
    defaultFormat?: string;
    defaultValue?: T | DefaultFunction<T>;
}

export type ISlurpPropSetting<T> = Pick<ISlurpProp<T>, 'id' | 'key' | 'idx' | 'format' | 'enabled' | 'custom'>;

export class SlurpProp<T> {
    [index: string]: string | number | string[] | boolean | T | DefaultFunction<T> | undefined | object
    readonly id: string
    readonly defaultIdx?: number
    readonly defaultKey?: string
    readonly description?: string			            // for use in settings and note prop comments
    enabled: boolean    		            // whether to parse + write to notes
    custom: boolean
    metaFields?: string[]   	                // <meta> attrs to check
    _key?: string
    _idx?: number
    _format?: string		                    // optional format, mainly for dates
    defaultFormat?: string
    defaultValue?: T | DefaultFunction<T>   // default value for custom and derived props

    constructor({ id, enabled, key, idx, format, defaultIdx, defaultKey, description, metaFields, defaultFormat, defaultValue, custom }: ISlurpProp<T>) {
        this.id = id;
        this.enabled = enabled != null ? enabled : true;
        this.key = key || defaultKey || id;
        this.idx = idx != null
            ? idx
            : defaultIdx != null
                ? defaultIdx
                : 0;
        this.format = format;
        this.defaultIdx = defaultIdx;
        this.defaultKey = defaultKey;
        this.description = description;
        this.metaFields = metaFields;
        this.defaultFormat = defaultFormat;
        this.defaultValue = defaultValue;
        this.custom = custom === null ? false : custom;
    }

    get key() { return this._key || this.defaultKey || this.id }
    set key(val) { this._key = val }
    get idx() {
        return this._idx !== undefined
            ? this._idx
            : this.defaultIdx !== undefined
                ? this.defaultIdx
                : Infinity
    }
    set idx(val) { this._idx = val }
    get format() { return this._format || this.defaultFormat }
    set format(val) { this._format = val }

    getSetting(): ISlurpPropSetting<T> {
        return { id: this.id, key: this.key, idx: this.idx, format: this.format, enabled: this.enabled, custom: this.custom }
    }

    static fromSettings(settings: SlurpPropSettings, defaults: SlurpProps): SlurpProps {
        const slurpProps: SlurpProps = {};
        for (let i in settings) {
            slurpProps[i] = new SlurpProp({ ...settings[i], ...defaults[i] || {} });
        }
        for (let i in defaults) {
            if (!slurpProps[i]) slurpProps[i] = new SlurpProp({ ...defaults[i] });
        }
        return slurpProps;
    }
}

export type SlurpProps = { [s: string]: SlurpProp<any> };
export type SlurpPropSettings = { [s: string]: ISlurpPropSetting<any> }
