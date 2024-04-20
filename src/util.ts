import { Vault, normalizePath } from "obsidian";
import type { FrontMatterProp } from "src/frontmatter";
import type { StringCase } from "src/string-case";
import { logger } from "./logger";

export const isEmpty = (val: any): boolean => {
    return val == null
        || (typeof val === 'string' && val.trim().length == 0)
        || (typeof val[Symbol.iterator] === 'function' && val.length === 0)
}

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

}

export const ensureFolderExists = async (vault: Vault, path: string) => {
    const existingFolder = vault.getFolderByPath(path);
    logger().debug(`getFolderByPath("${path}")`, existingFolder);
    return existingFolder !== null
        ? existingFolder.path
        : path === ""
            ? ""
            : await (await vault.createFolder(path)).path;

}

const handleDuplicates = (vault: Vault, filename: string, retries: number, path: string): string => {
    if (retries == 100) throw "Cowardly refusing to increment past 100.";

    const suffix = retries > 0 ? ` (${retries}).md` : '.md';
    const fullPath = path !== ""
        ? `${path}/${filename}${suffix}`
        : `${filename}${suffix}`;
    const normPath = normalizePath(fullPath);

    logger().debug(`checking if path is available: ${normPath}`);
    return vault.getFileByPath(normPath) ? handleDuplicates(vault, filename, retries + 1, path) : normPath
}

export const getNewFilePath = async (vault: Vault, title: string, pathSetting: string): Promise<string> => {

    const titleClean = cleanTitle(title);
    logger().debug(`finalised title: ${title}`);

    const path = await ensureFolderExists(vault, pathSetting);
    logger().debug(`finalised folder: ${path}`);

    return handleDuplicates(vault, titleClean, 0, path);
};

export const sortFrontMatterItems = (items: FrontMatterProp[]) => items.sort((a, b) => a.idx - b.idx);

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
}

export const mapToObj = (m: Map<string, any>) => {
    return Array.from(m).reduce((obj, [key, value]) => {
        // @ts-ignore
        obj[key] = value;
        return obj;
    }, {});
};

export const serialize = (val: any) => {
    if (val instanceof Map) return mapToObj(val);
    if (val instanceof Set) return Array.from(val);
    return val;
}