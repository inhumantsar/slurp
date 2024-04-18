import { Pair, stringify } from "yaml";
import { format } from "./formatters";
import { SlurpProp, type SlurpProps } from "./slurp-prop";
import type { SlurpArticle } from "./types/article";
import { isEmpty } from "./util";

export const getFrontMatterValue = (prop: SlurpProp<any>, article: SlurpArticle, showEmpty: boolean) => {
    if (isEmpty(article[prop.id]) && prop.defaultValue !== undefined)
        return typeof prop.defaultValue === "function"
            ? prop.defaultValue()
            : prop.defaultValue;

    if (!isEmpty(article[prop.id]) || showEmpty)
        return prop.format
            ? format(prop.format, article[prop.id])
            : article[prop.id];
}

export const getFrontMatterYaml = (fm: Map<string, any>, idx: Map<string, number>) => {
    const yamlSort = (a: Pair, b: Pair) => (idx.get(a.key as string) || 0) - (idx.get(b.key as string) || 0);
    return stringify(Object.fromEntries(fm), { sortMapEntries: yamlSort }).trim();
}

export const createFrontMatter = (article: SlurpArticle, slurpProps: SlurpProps, showEmpty: boolean): string | undefined => {
    const fm = new Map<string, any>();
    // we want to sort by key not by id
    const keyIndex = new Map<string, number>();

    for (let i in slurpProps) {
        const prop = slurpProps[i];
        if (!prop.enabled) continue;

        fm.set(prop.key, getFrontMatterValue(prop, article, showEmpty));
        keyIndex.set(prop.key, prop.idx);
    };

    return getFrontMatterYaml(fm, keyIndex);
}

