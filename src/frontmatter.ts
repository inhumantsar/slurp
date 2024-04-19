import { Pair, Scalar, stringify } from "yaml";
import { FRONT_MATTER_ITEM_DEFAULTS } from "./const";
import { format } from "./formatters";
import { logger } from "./logger";
import type {
    IArticle, IFrontMatterProp, IFrontMatterPropDefault, IFrontMatterPropDefaultValue,
    IFrontMatterPropSetting, IFrontMatterPropSettings, IFrontMatterValidationErrors, TFrontMatterProps
} from "./types";
import { isEmpty } from "./util";

export class FrontMatterProp implements IFrontMatterProp {
    [index: string]: string | number | string[] | boolean | IFrontMatterPropDefaultValue | undefined | object

    readonly id: string
    public enabled = true
    public custom = false
    public metaFields?: string[]
    readonly defaultIdx?: number
    readonly defaultKey?: string
    readonly description?: string
    public defaultFormat?: string
    public defaultValue?: IFrontMatterPropDefaultValue
    _key?: string
    _idx?: number
    _format?: string

    get key(): string { return this._key || this.defaultKey || this.id }
    set key(val: string) { this._key = val }
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

    constructor(s?: IFrontMatterPropSetting, d?: IFrontMatterPropDefault) {
        if (!d && !s) throw Error("FrontMatterProp objects require either a setting or a default");

        this._key = s?.key;
        this._idx = s?.idx;
        this._format = s?.format;
        this.id = d ? d.id : s?.id || "err";
        this.enabled = s?.enabled === undefined ? true : s.enabled;
        this.custom = s?.custom ?? false;
        this.metaFields = d?.metaFields;
        this.defaultIdx = d?.defaultIdx;
        this.defaultKey = d?.defaultKey;
        this.description = d?.description;
        this.defaultFormat = d?.defaultFormat;
        this.defaultValue = d?.defaultValue;
    }

    public getSetting = (): IFrontMatterPropSetting => {
        return { id: this.id, key: this.key, idx: this.idx, format: this.format, enabled: this.enabled, custom: this.custom }
    }

    public validateKey = (): string[] => {
        const e = new Array<string>();
        if (!this._key)
            e.push("All properties must have a key.");
        if (this._key?.match(/^[^\p{L}0-9]|[^\p{L}0-9]$/gu) !== null)
            e.push("Property keys must begin and end with alphanumeric characters.");
        if (this._key?.match(/[^\p{L}0-9 ._\-]/gu) !== null)
            e.push("Property keys may only contain alphanumeric characters, spaces, dots, dashes, and underscores.");
        return e;
    }

    private validateFormatMultiString = (): string[] => {
        const e = new Array<string>();
        const fmt = this._format;
        const def = this.defaultFormat;
        const isMultiString = fmt?.startsWith("S|");
        const reqMultiString = def?.startsWith("S|");

        if (isMultiString && !reqMultiString)
            e.push("Multi-string formats can only be used with supported properties.");

        if (!isMultiString && reqMultiString)
            e.push("The format string for this property must start with 'S|'.");

        if (isMultiString && reqMultiString) {
            const matches = def?.match(/(\{\w+\})/g);
            if (!matches?.some((val) => fmt?.contains(val)))
                e.push(`This format string must contain at least one of ${matches?.join(", ")}.`);
        }
        return e
    }

    private validateFormatBoolean = (): string[] => {
        if (!this._format?.startsWith('b|')) return [];

        if (!['b|true', 'b|false'].contains(this._format.toLowerCase()))
            return ["Boolean formats must be either 'true' or 'false'."];

        return [];
    }

    public validateFormat = (): string[] => {
        const e = new Array<string>();
        const fmt = this._format;
        // it's ok if fmt is falsey
        if (!fmt) return [];

        if (fmt?.match(/^[dbsS]\|/) === null)
            e.push("Format strings must begin with a type identifier: 'b|' for booleans, 'd|' for dates, or 's|' for strings.");

        if (fmt?.startsWith("s|") && !fmt?.contains("{s}"))
            e.push("String formats must contain at least one replacement placeholder '{s}'");

        return [...e, ...this.validateFormatMultiString(), ...this.validateFormatBoolean()]
    }
}

export const createFrontMatterPropSettings = (props: TFrontMatterProps): IFrontMatterPropSettings =>
    Object.fromEntries(
        Array.from(props.values())
            .map((v): [string, IFrontMatterPropSetting] => [v.id, v.getSetting()]));


export const createFrontMatterProps = (settings?: IFrontMatterPropSettings): TFrontMatterProps => {
    return new Map<string, FrontMatterProp>(
        Array.from(new Set([...settings ? Object.keys(settings) : [], ...FRONT_MATTER_ITEM_DEFAULTS.keys()]))
            .map((k) => [k, new FrontMatterProp(settings ? settings[k] : undefined, FRONT_MATTER_ITEM_DEFAULTS.get(k))]));
}

export const validateFrontMatterProps = (props: FrontMatterProp[]): IFrontMatterValidationErrors[] => {
    return props.map((prop) => {
        const fmt = prop.validateFormat();
        const key = prop.validateKey();
        return { format: fmt, key: key, hasErrors: fmt.length + key.length > 0 } as IFrontMatterValidationErrors
    });

};


export const getFrontMatterValue = (fmItem: IFrontMatterProp, article: IArticle, showEmpty: boolean) => {
    if (isEmpty(article[fmItem.id]) && fmItem.defaultValue !== undefined)
        return typeof fmItem.defaultValue === "function"
            ? fmItem.defaultValue()
            : fmItem.defaultValue;

    if (!isEmpty(article[fmItem.id]) || showEmpty)
        return fmItem.format
            ? format(fmItem.format, article[fmItem.id])
            : article[fmItem.id] !== undefined
                ? article[fmItem.id]
                : null;
}

export const getFrontMatterYaml = (fm: Map<string, any>, idx: Map<string, number>) => {
    logger().debug("stringifying yaml...", fm, idx);
    const yamlSort = (a: Pair, b: Pair) => {
        const ak = (a.key as Scalar).toString();
        const bk = (b.key as Scalar).toString();
        const aidx = idx.get(ak) || 0;
        const bidx = idx.get(bk) || 0;
        logger().debug("yaml sort", { ak, aidx, bk, bidx });
        return aidx - bidx;
    };
    return stringify(fm, { sortMapEntries: yamlSort, nullStr: "" }).trim();
}

export const createFrontMatter = (article: IArticle, fmItems: TFrontMatterProps, showEmpty: boolean): string | undefined => {
    const fm = new Map<string, any>();
    // we want to sort by key not by id
    const keyIndex = new Map<string, number>();

    fmItems.forEach((v) => {
        if (v.enabled) {
            fm.set(v.key, getFrontMatterValue(v, article, showEmpty));
            keyIndex.set(v.key, v.idx);
        }
    })

    return getFrontMatterYaml(fm, keyIndex);
}

