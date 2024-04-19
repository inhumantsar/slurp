import { Vault, normalizePath } from "obsidian";
import { DEFAULT_PATH } from "src/const";
import type { FrontMatterProp } from "src/frontmatter";
import type { StringCase } from "src/string-case";

export const isEmpty = (val: any): boolean => {
    return val == null
        || (typeof val === 'string' && val.trim().length == 0)
        || (typeof val[Symbol.iterator] === 'function' && val.length === 0)
}

export const createFilePath = async (vault: Vault, title: string, path: string = DEFAULT_PATH): Promise<string> => {
    // increment suffix on duplicated file names... to a point.
    const fpLoop = (p: string, fn: string, retries: number): string => {
        if (retries == 100) throw "Cowardly refusing to increment past 100.";
        const suffix = retries > 0 ? `-${retries}.md` : '.md';
        const fp = normalizePath(`${p}/${fn}${suffix}`);
        return vault.getFileByPath(fp) ? fpLoop(p, fn, retries + 1) : fp
    }

    // TODO: add setting for slurped pages folder
    const folder = vault.getFolderByPath(path) || await vault.createFolder(path);
    const fileName = title.replace(/[\\\/:]/g, '-');

    return fpLoop(folder.path, fileName, 0);
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