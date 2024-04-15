import { DEFAULT_PATH } from "const";
import { Vault, normalizePath } from "obsidian";

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