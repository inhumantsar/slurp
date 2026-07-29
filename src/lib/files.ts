import { normalizePath, type Vault } from "obsidian";
import { logger } from "./logger";
import { cleanTitle } from "./util";


export const ensureFolderExists = async (vault: Vault, path: string): Promise<string> => {
    if (path === "") return "";

    const normalizedPath = normalizePath(path);
    const segments = normalizedPath.split("/").filter(Boolean);
    let currentPath = "";

    for (const segment of segments) {
        currentPath = currentPath === "" ? segment : `${currentPath}/${segment}`;
        const existingFolder = vault.getFolderByPath(currentPath);
        logger().debug(`getFolderByPath("${currentPath}")`, existingFolder);
        if (existingFolder !== null) continue;

        try {
            await vault.createFolder(currentPath);
        } catch (err) {
            if (vault.getFolderByPath(currentPath) === null) throw err;
        }
    }

    return normalizedPath;
};

const handleDuplicates = (vault: Vault, filename: string, retries: number, path: string): string => {
    if (retries === 100) throw new Error("Cowardly refusing to increment past 100.");

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
