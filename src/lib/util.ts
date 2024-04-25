import type { StringCase } from "./string-case";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const isEmpty = (val: any): boolean => {
    return val == null
        || (typeof val === 'string' && val.trim().length === 0)
        || (typeof val[Symbol.iterator] === 'function' && val.length === 0);
};

export const removeTrailingSlash = (str: string) =>
    str.endsWith('/')
        ? str.substring(0, str.length - 1)
        : str;

export const cleanTitle = (title: string) => {
    // disallowed characters: * " \ / < > : | ?
    return title
        // assume that a colons and pipes are most likely a useful separator, eg:
        //   OpenNeRF: Open Set 3D Neural Scene Segmentation...
        //   Local News | Botched home sale costs man his real estate license
        //   Blog|Some Title
        .replace(/\s?[\|:]\s?/g, ' - ')
        // assume that quotes are used to enclose words/phrases
        // eg: Bitcoin prices edges lower after "Halving" concludes
        .replace('"', "'")
        // assume that others can simply be nuked
        .replace(/[\*"\\/<>:\?]/g, '');

};

export const updateStringCase = (text: string, targetCase: StringCase) => {
    switch (targetCase) {
        case "PascalCase":
            return text.replace(/ ./g, (str) => str.trim().toUpperCase()).replace(/^./, (str) => str.toUpperCase());
        case "camelCase":
            return text.replace(/ ./g, (str) => str.trim().toUpperCase()).replace(/^./, (str) => str.toLowerCase());
        case "snake_case":
            return text.replace(/ /g, '_').toLowerCase();
        case "kebab-case":
            return text.replace(/ /g, '-').toLowerCase();
        default:
            return text.replace(/ /g, '-');
    }
};

export const mapToObj = (m: Map<string, unknown>) => {
    return Array.from(m).reduce((obj, [key, value]) => {
        // @ts-ignore
        obj[key] = value;
        return obj;
    }, {});
};

export const serialize = (val: unknown) => {
    if (val instanceof Map) return mapToObj(val);
    if (val instanceof Set) return Array.from(val);
    return val;
};