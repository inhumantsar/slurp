import type { SlurpPropSetting, SlurpPropSettings } from "src/types/settings";
import type { ISlurpProp, SlurpPropDefault } from "./types/slurp-prop";

export type SlurpProps = { [s: string]: SlurpProp<any> };

export class SlurpProp<T> {
    [index: string]: string | number | string[] | boolean | T | SlurpPropDefault<T> | undefined | object
    readonly id: string
    readonly defaultIdx?: number
    readonly defaultKey?: string
    readonly description?: string           // for use in settings and note prop comments
    enabled: boolean    		            // whether to parse + write to notes
    custom: boolean
    metaFields?: string[]                   // <meta> attrs to check
    _key?: string
    _idx?: number
    _format?: string                        // optional format, mainly for templating things like dates
    defaultFormat?: string
    defaultValue?: SlurpPropDefault<T>      // default value for custom and derived props

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

    getSetting(): SlurpPropSetting {
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
