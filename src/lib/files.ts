import { normalizePath, type Vault } from "obsidian";
import { logger } from "./logger";
import { cleanTitle } from "./util";


export const ensureFolderExists = async (vault: Vault, path: string) => {
    const existingFolder = vault.getFolderByPath(normalizePath(path));
    logger().debug(`getFolderByPath("${path}")`, existingFolder);
    return existingFolder !== null
        ? existingFolder.path
        : path === ""
            ? ""
            : await (await vault.createFolder(path)).path;

};

const handleDuplicates = (vault: Vault, filename: string, retries: number, path: string): string => {
    if (retries === 100) throw "Cowardly refusing to increment past 100.";

    const suffix = retries > 0 ? ` (${retries}).md` : '.md';
    const fullPath = path !== ""
        ? `${path}/${filename}${suffix}`
        : `${filename}${suffix}`;
    const normPath = normalizePath(fullPath);

    logger().debug(`checking if path is available: ${normPath}`);
    return vault.getFileByPath(normPath) ? handleDuplicates(vault, filename, retries + 1, path) : normPath;
};

export const getNewFilePath = async (vault: Vault, title: string, pathSetting: string): Promise<string> => {

    const titleClean = cleanTitle(title);
    logger().debug(`finalised title: ${title}`);

    const path = await ensureFolderExists(vault, pathSetting);
    logger().debug(`finalised folder: ${path}`);

    return handleDuplicates(vault, titleClean, 0, path);
};
