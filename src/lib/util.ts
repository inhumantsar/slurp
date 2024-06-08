import type { StringCase } from "./string-case";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export const isEmpty = (val: any): boolean => {
    return !val
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
        .replace(/[\*"\\/#<>:\?]/g, '');

};

export const cleanTag = (text: string, tagCase: StringCase): string => {
    const other = new RegExp(/[^\w\-\/]+/g);
    const extraWhitespace = new RegExp(/\s{2,}/);
    return updateStringCase(
        text
            // & is used almost exclusively to mean "and"
            // wrapping the word with spaces so updateStringCase handles it gracefully later
            .replace('&', ' and ')
            // : is used mainly for categories. TODO: look for "Categor(y|ies)" and strip it?
            .replace(':',"/")
            // use spaces in place of other invalid chars to maintain word separation
            .replace(other, ' ')
            // collapse multiple spaces into a single space
            .replace(extraWhitespace, ' ')
            .trim(),
        tagCase);
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

// murmurhash3 is simple, fast, and doesn't have external dependencies.
export const murmurhash3_32 = (key: string, seed: number = 0) => {
    var remainder, bytes, h1, h1b, c1, c2, k1, i;

    // Initialize the variables
    remainder = key.length & 3; // key.length % 4
    bytes = key.length - remainder;
    h1 = seed;
    c1 = 0xcc9e2d51;
    c2 = 0x1b873593;
    i = 0;

    // Process the input data in 4-byte chunks
    while (i < bytes) {
        // extract the next 4 bytes and combine into a 32 bit int
        k1 =
            ((key.charCodeAt(i) & 0xff)) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;

        // mix the int with the constants
        //    | 1st half x const |   | again w 2nd half, keep 1st 16 bits |
        k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
        // rotate bits left by 15 bits
        k1 = (k1 << 15) | (k1 >>> 17);
        // repeat mixing, but with the other constant
        k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;

        // combine with hash using XOR
        h1 ^= k1;
        // rotate left by 13 bits
        h1 = (h1 << 13) | (h1 >>> 19);
        // mix the hash with magic constants to break up patterns and ensure each bit of 
        // input can influence the result
        h1b = (((h1 & 0xffff) * 5) + ((((h1 >>> 16) * 5) & 0xffff) << 16)) & 0xffffffff;
        h1 = (((h1b & 0xffff) + 0x6b64) + ((((h1b >>> 16) + 0xe654) & 0xffff) << 16));
    }

    // Process any remaining bytes
    k1 = 0;
    switch (remainder) {
        case 3: k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        case 2: k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        case 1: k1 ^= (key.charCodeAt(i) & 0xff);
            k1 = (((k1 & 0xffff) * c1) + ((((k1 >>> 16) * c1) & 0xffff) << 16)) & 0xffffffff;
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = (((k1 & 0xffff) * c2) + ((((k1 >>> 16) * c2) & 0xffff) << 16)) & 0xffffffff;
            h1 ^= k1;
    }

    // Finalize the hash value
    h1 ^= key.length;

    // Perform some final mixing of the hash to ensure a good distribution
    h1 ^= h1 >>> 16;
    h1 = (((h1 & 0xffff) * 0x85ebca6b) + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 13;
    h1 = (((h1 & 0xffff) * 0xc2b2ae35) + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16)) & 0xffffffff;
    h1 ^= h1 >>> 16;

    // Return the resulting hash as an unsigned 32-bit integer
    return h1 >>> 0;
};

export const extractDomain = (u: string) => {
    // naively strap a proto in case it doesn't have one
    const url = (u.split(":").length == 1) ? `https://${u}` : u;
    try {
        const urlObj = new URL(url);
        if (urlObj.protocol === "http:" || urlObj.protocol === "https:") {
            const parts = urlObj.host.split('.');
            const domain = parts[parts.length - 2] + '.' + parts[parts.length - 1];
            if (!domain.startsWith(".") && !domain.endsWith(".")) return domain;
        }
    } catch (err) {
        // returning null after this anyway...
    }

    return null;
};