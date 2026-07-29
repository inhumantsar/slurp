import { normalizePath, requestUrl } from "obsidian";

import type { IPostProcessorContext } from "../types";
import { ensureFolderExists } from "./files";
import { logger } from "./logger";
import { cleanTitle, murmurhash3_32 } from "./util";

interface IImageDestination {
    readonly start: number;
    readonly end: number;
    readonly destination: string;
}

interface IResolvedImage {
    readonly url: string;
    readonly parsedUrl: URL;
    readonly destinations: IImageDestination[];
}

interface IReplacement {
    readonly start: number;
    readonly end: number;
    readonly value: string;
}

interface IFence {
    readonly marker: "`" | "~";
    readonly length: number;
}

const MIME_EXTENSIONS: Readonly<Record<string, string>> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/avif": ".avif",
    "image/bmp": ".bmp",
    "image/tiff": ".tiff",
    "image/x-icon": ".ico",
};

const countRun = (text: string, start: number, character: string): number => {
    let end = start;
    while (text[end] === character) end++;
    return end - start;
};

const fenceAt = (markdown: string, lineStart: number): IFence | null => {
    let cursor = lineStart;
    while (cursor < lineStart + 3 && markdown[cursor] === " ") cursor++;
    const marker = markdown[cursor];
    if (marker !== "`" && marker !== "~") return null;

    const length = countRun(markdown, cursor, marker);
    if (length < 3) return null;
    const lineEnd = markdown.indexOf("\n", cursor + length);
    const rest = markdown.slice(cursor + length, lineEnd === -1 ? markdown.length : lineEnd);
    return marker === "`" && rest.includes("`") ? null : { marker, length };
};

const findFenceEnd = (markdown: string, start: number, fence: IFence): number => {
    const openingLineEnd = markdown.indexOf("\n", start);
    if (openingLineEnd === -1) return markdown.length;

    let lineStart = openingLineEnd + 1;
    while (lineStart < markdown.length) {
        let cursor = lineStart;
        while (cursor < lineStart + 3 && markdown[cursor] === " ") cursor++;
        const runLength = countRun(markdown, cursor, fence.marker);
        const lineEnd = markdown.indexOf("\n", cursor + runLength);
        const end = lineEnd === -1 ? markdown.length : lineEnd;
        if (runLength >= fence.length && markdown.slice(cursor + runLength, end).trim() === "") {
            return lineEnd === -1 ? markdown.length : lineEnd + 1;
        }
        lineStart = lineEnd === -1 ? markdown.length : lineEnd + 1;
    }
    return markdown.length;
};

const findCodeSpanEnd = (markdown: string, start: number): number | null => {
    const runLength = countRun(markdown, start, "`");
    let cursor = start + runLength;
    while (cursor < markdown.length) {
        const next = markdown.indexOf("`", cursor);
        if (next === -1) return null;
        const closingLength = countRun(markdown, next, "`");
        if (closingLength === runLength) return next + closingLength;
        cursor = next + closingLength;
    }
    return null;
};

const isEscaped = (text: string, index: number): boolean => {
    let backslashes = 0;
    for (let cursor = index - 1; cursor >= 0 && text[cursor] === "\\"; cursor--) backslashes++;
    return backslashes % 2 === 1;
};

const findAltEnd = (markdown: string, start: number): number | null => {
    let depth = 1;
    for (let cursor = start + 1; cursor < markdown.length; cursor++) {
        if (markdown[cursor] === "\\") {
            cursor++;
            continue;
        }
        if (markdown[cursor] === "[") depth++;
        if (markdown[cursor] !== "]") continue;
        depth--;
        if (depth === 0) return cursor;
    }
    return null;
};

const findQuotedTitleEnd = (markdown: string, start: number, delimiter: string): number | null => {
    for (let cursor = start + 1; cursor < markdown.length; cursor++) {
        if (markdown[cursor] === "\\") {
            cursor++;
            continue;
        }
        if (markdown[cursor] === delimiter) return cursor + 1;
    }
    return null;
};

const findParenthesizedTitleEnd = (markdown: string, start: number): number | null => {
    let depth = 1;
    for (let cursor = start + 1; cursor < markdown.length; cursor++) {
        if (markdown[cursor] === "\\") {
            cursor++;
            continue;
        }
        if (markdown[cursor] === "(") depth++;
        if (markdown[cursor] !== ")") continue;
        depth--;
        if (depth === 0) return cursor + 1;
    }
    return null;
};

const findTitleEnd = (markdown: string, start: number): number | null => {
    const delimiter = markdown[start];
    if (delimiter === "\"" || delimiter === "'") return findQuotedTitleEnd(markdown, start, delimiter);
    if (delimiter === "(") return findParenthesizedTitleEnd(markdown, start);
    return null;
};

const parseAngleDestination = (markdown: string, start: number): { end: number; cursor: number } | null => {
    for (let cursor = start + 1; cursor < markdown.length; cursor++) {
        if (markdown[cursor] === "\\") {
            cursor++;
            continue;
        }
        if (markdown[cursor] === ">") return { end: cursor, cursor: cursor + 1 };
        if (markdown[cursor] === "\n") return null;
    }
    return null;
};

const parseBareDestination = (markdown: string, start: number): { end: number; cursor: number } => {
    let depth = 0;
    let cursor = start;
    while (cursor < markdown.length) {
        const character = markdown[cursor];
        if (character === "\\") {
            cursor += 2;
            continue;
        }
        if (character === "(" ) depth++;
        if (character === ")") {
            if (depth === 0) break;
            depth--;
        }
        if (/\s/.test(character) && depth === 0) break;
        cursor++;
    }
    return { end: cursor, cursor };
};

const parseImageAt = (markdown: string, start: number): IImageDestination | null => {
    if (markdown[start] !== "!" || markdown[start + 1] !== "[" || isEscaped(markdown, start)) return null;
    const altEnd = findAltEnd(markdown, start + 1);
    if (altEnd === null || markdown[altEnd + 1] !== "(") return null;

    let cursor = altEnd + 2;
    while (/\s/.test(markdown[cursor] ?? "")) cursor++;
    const angle = markdown[cursor] === "<";
    const destinationStart = cursor + (angle ? 1 : 0);
    const parsed = angle ? parseAngleDestination(markdown, cursor) : parseBareDestination(markdown, cursor);
    if (parsed === null) return null;

    cursor = parsed.cursor;
    let whitespace = 0;
    while (/\s/.test(markdown[cursor] ?? "")) {
        cursor++;
        whitespace++;
    }
    if (markdown[cursor] !== ")") {
        if (whitespace === 0) return null;
        const titleEnd = findTitleEnd(markdown, cursor);
        if (titleEnd === null) return null;
        cursor = titleEnd;
        while (/\s/.test(markdown[cursor] ?? "")) cursor++;
        if (markdown[cursor] !== ")") return null;
    }

    return {
        start: destinationStart,
        end: parsed.end,
        destination: markdown.slice(destinationStart, parsed.end),
    };
};

const scanImageDestinations = (markdown: string): IImageDestination[] => {
    const destinations: IImageDestination[] = [];
    let cursor = 0;
    while (cursor < markdown.length) {
        if (cursor === 0 || markdown[cursor - 1] === "\n") {
            const fence = fenceAt(markdown, cursor);
            if (fence !== null) {
                cursor = findFenceEnd(markdown, cursor, fence);
                continue;
            }
        }
        if (markdown[cursor] === "`") {
            const codeEnd = findCodeSpanEnd(markdown, cursor);
            if (codeEnd !== null) {
                cursor = codeEnd;
                continue;
            }
        }
        const destination = parseImageAt(markdown, cursor);
        if (destination !== null) {
            destinations.push(destination);
            cursor = destination.end;
            continue;
        }
        cursor++;
    }
    return destinations;
};

const isAsciiPunctuation = (character: string): boolean => {
    const code = character.charCodeAt(0);
    return (code >= 0x21 && code <= 0x2f)
        || (code >= 0x3a && code <= 0x40)
        || (code >= 0x5b && code <= 0x60)
        || (code >= 0x7b && code <= 0x7e);
};

const unescapeDestination = (destination: string): string => destination.replace(
    /\\([\s\S])/g,
    (match, character: string) => isAsciiPunctuation(character) ? character : match,
);

const resolveImages = (destinations: IImageDestination[], articleLink: string): IResolvedImage[] => {
    const byUrl = new Map<string, IResolvedImage>();
    for (const destination of destinations) {
        const unescaped = unescapeDestination(destination.destination);
        if (unescaped.trim() === "" || unescaped.trim().startsWith("#")) continue;

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(unescaped, articleLink);
        } catch {
            continue;
        }
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") continue;
        parsedUrl.hash = "";

        const existing = byUrl.get(parsedUrl.href);
        if (existing !== undefined) {
            existing.destinations.push(destination);
            continue;
        }
        byUrl.set(parsedUrl.href, { url: parsedUrl.href, parsedUrl, destinations: [destination] });
    }
    return Array.from(byUrl.values());
};

const resolveStorageDirectory = (filePath: string, folderSetting: string): string | null => {
    const normalizedFilePath = normalizePath(filePath.replace(/\\/g, "/"));
    const slash = normalizedFilePath.lastIndexOf("/");
    const noteParent = slash === -1 ? "" : normalizedFilePath.slice(0, slash);
    const folder = folderSetting.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
    const segments = folder.split("/").filter((segment) => segment !== "" && segment !== ".");
    if (segments.includes("..")) return null;

    const combined = [noteParent, ...segments].filter(Boolean).join("/");
    const directory = combined === "" ? "" : normalizePath(combined);
    if (noteParent === "") return directory === ".." || directory.startsWith("../") ? null : directory;
    return directory === noteParent || directory.startsWith(`${noteParent}/`) ? directory : null;
};

const contentTypeExtension = (headers: Record<string, string>): string => {
    const header = Object.entries(headers).find(([name]) => name.toLowerCase() === "content-type")?.[1] ?? "";
    const mime = header.split(";", 1)[0].trim().toLowerCase();
    return MIME_EXTENSIONS[mime] ?? "";
};

const imageBasename = (url: URL, headers: Record<string, string>): string => {
    const encodedName = url.pathname.split("/").filter(Boolean).at(-1) ?? "image";
    let decodedName: string;
    try {
        decodedName = decodeURIComponent(encodedName);
    } catch {
        decodedName = "image";
    }
    let basename = cleanTitle(decodedName).trim() || "image";
    if (!/\.[^./]+$/.test(basename)) basename += contentTypeExtension(headers);
    return basename;
};

const buffersEqual = (left: ArrayBuffer, right: ArrayBuffer): boolean => {
    if (left.byteLength !== right.byteLength) return false;
    const leftBytes = new Uint8Array(left);
    const rightBytes = new Uint8Array(right);
    for (let index = 0; index < leftBytes.length; index++) {
        if (leftBytes[index] !== rightBytes[index]) return false;
    }
    return true;
};

const candidateNames = (articleHash: string, imageHash: string, basename: string): string[] => {
    const names = [`${articleHash}_${basename}`, `${articleHash}_${imageHash}_${basename}`];
    for (let index = 2; index <= 100; index++) names.push(`${articleHash}_${imageHash}_${index}_${basename}`);
    return names;
};

const joinVaultPath = (directory: string, filename: string): string => directory === "" ? filename : `${directory}/${filename}`;

const saveImage = async (
    context: IPostProcessorContext,
    image: IResolvedImage,
    directory: string,
    articleHash: string,
    buffer: ArrayBuffer,
    headers: Record<string, string>,
    owners: Map<string, string>,
): Promise<string> => {
    const basename = imageBasename(image.parsedUrl, headers);
    const imageHash = murmurhash3_32(image.url).toString(16).padStart(8, "0");
    for (const candidate of candidateNames(articleHash, imageHash, basename)) {
        const targetPath = joinVaultPath(directory, candidate);
        const owner = owners.get(targetPath);
        if (owner !== undefined && owner !== image.url) continue;

        const existing = context.vault.getFileByPath(targetPath);
        if (existing !== null) {
            if (!buffersEqual(await context.vault.readBinary(existing), buffer)) continue;
            owners.set(targetPath, image.url);
            return targetPath;
        }

        try {
            await context.vault.createBinary(targetPath, buffer);
            owners.set(targetPath, image.url);
            return targetPath;
        } catch (err) {
            const racedFile = context.vault.getFileByPath(targetPath);
            if (racedFile === null) throw err;
            if (!buffersEqual(await context.vault.readBinary(racedFile), buffer)) continue;
            owners.set(targetPath, image.url);
            return targetPath;
        }
    }
    throw new Error("No safe image filename remained after 100 collision retries.");
};

const encodeLinkSegment = (segment: string): string => encodeURIComponent(segment).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
);

const relativeMarkdownPath = (targetPath: string, filePath: string): string => {
    const normalizedFilePath = normalizePath(filePath.replace(/\\/g, "/"));
    const slash = normalizedFilePath.lastIndexOf("/");
    const noteParent = slash === -1 ? "" : normalizedFilePath.slice(0, slash);
    const relativePath = noteParent === "" ? targetPath : targetPath.slice(noteParent.length + 1);
    return relativePath.split("/").map(encodeLinkSegment).join("/");
};

const failureMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);

export async function saveImagesLocally(markdown: string, context: IPostProcessorContext): Promise<string> {
    const destinations = scanImageDestinations(markdown);
    if (destinations.length === 0) return markdown;

    const articleLink = typeof context.article.link === "string" ? context.article.link : "";
    if (articleLink === "") {
        logger().warn("Unable to save images locally because the article has no source URL.");
        return markdown;
    }

    const images = resolveImages(destinations, articleLink);
    if (images.length === 0) return markdown;

    const directory = resolveStorageDirectory(context.filePath, context.settings.images.folder);
    if (directory === null) {
        logger().warn("Unable to save images locally because the image folder escapes the note directory.", {
            folder: context.settings.images.folder,
        });
        return markdown;
    }

    try {
        await ensureFolderExists(context.vault, directory);
    } catch (err) {
        logger().warn("Unable to create the local image folder.", { directory, error: failureMessage(err) });
        return markdown;
    }

    const articleHash = murmurhash3_32(articleLink).toString(16).padStart(8, "0");
    const owners = new Map<string, string>();
    const replacements: IReplacement[] = [];
    const results = new Map<string, string | null>();

    for (const image of images) {
        let localPath: string | null = null;
        try {
            const response = await requestUrl({ url: image.url, method: "GET", throw: false });
            if (response.status < 200 || response.status >= 300 || response.arrayBuffer.byteLength === 0) {
                throw new Error(`HTTP ${response.status} returned ${response.arrayBuffer.byteLength} bytes.`);
            }
            localPath = await saveImage(
                context,
                image,
                directory,
                articleHash,
                response.arrayBuffer,
                response.headers,
                owners,
            );
        } catch (err) {
            logger().warn("Unable to save remote image locally.", { url: image.url, error: failureMessage(err) });
        }
        results.set(image.url, localPath);
        if (localPath === null) continue;

        const markdownPath = relativeMarkdownPath(localPath, context.filePath);
        for (const destination of image.destinations) {
            replacements.push({ start: destination.start, end: destination.end, value: markdownPath });
        }
    }

    void results;
    replacements.sort((left, right) => right.start - left.start);
    let result = markdown;
    for (const replacement of replacements) {
        result = result.slice(0, replacement.start) + replacement.value + result.slice(replacement.end);
    }
    return result;
}
