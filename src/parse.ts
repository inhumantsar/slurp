import { Readability } from "@mozilla/readability";
import { htmlToMarkdown, requestUrl, sanitizeHTMLToDom } from "obsidian";
import { logger } from "./lib/logger";
import type { StringCase } from "./lib/string-case";
import { cleanTag, isEmpty } from "./lib/util";
import type { FormatterArgs, IArticle, IArticleMetadata, IArticleTags, TFrontMatterProps } from "./types";

export const fixRelativeLinks = (html: string, articleUrl: string) => {
    const url = new URL(articleUrl);

    return html
        // Handles absolute paths
        .replace(/(href|src)="\/([^/].*?)"/g, `$1="${url.origin}/$2"`)
        // Handles relative paths
        .replace(/(href|src)="([^/].*?)"/g, (match, p1, p2) => {
            // Check if it's a protocol-relative URL (starts with //) or has a protocol
            if (/^\/\//.test(p2) || /^[a-z][a-z0-9+.-]*:/.test(p2)) {
                return match; // return original if it's protocol-relative or has a protocol
            }
            return `${p1}="${new URL(p2, url.href)}"`;
        });
};

const decodeHtml = (buffer: ArrayBuffer, charset: string): string => {
    try {
        return new TextDecoder(charset, { ignoreBOM: false }).decode(buffer);
    } catch {
        return new TextDecoder('UTF-8', { ignoreBOM: false }).decode(buffer);
    }
};

const extractCharset = (headers: Record<string, string>, buffer: ArrayBuffer): string => {
    const contentType = Object.entries(headers).find(
        ([key]) => key.toLowerCase() === 'content-type',
    )?.[1] ?? '';
    const headerMatch = /charset\s*=\s*([^\s;]+)/i.exec(contentType);
    if (headerMatch) return headerMatch[1];

    const head = new TextDecoder('latin1').decode(buffer.slice(0, 4096));
    const metaMatch = /<meta[^>]+charset\s*=\s*["']?\s*([^"'\s;>]+)/i.exec(head);
    if (metaMatch) return metaMatch[1];

    const httpEquivPattern = new RegExp(
        '<meta[^>]+http-equiv\\s*=\\s*["\']?\\s*Content-Type\\s*["\']?[^>]*content\\s*=\\s*["\']' +
        '[^"\']*charset\\s*=\\s*([^"\'\\s;>]+)',
        'i',
    );
    const httpEquivMatch = httpEquivPattern.exec(head);
    if (httpEquivMatch) return httpEquivMatch[1];

    return 'UTF-8';
};

export const fetchHtml = async (url: string) => {
    const response = await requestUrl(url);
    const charset = extractCharset(response.headers, response.arrayBuffer);
    const html = decodeHtml(response.arrayBuffer, charset);

    if (!html) {
        logger().error(`Unable to fetch page from: ${url}.`);
        throw new Error("Unable to fetch page.");
    }
    return fixRelativeLinks(html, url);
};

export const parsePage = (doc: Document) => {
    const article = new Readability(doc).parse();
    const title = article?.title;
    const content = article?.content;

    if (!article || !title || !content) {
        logger().error("Parsed article missing critical content", article);
        throw new Error("No title or content found.");
    }
    return Object.assign(article, { title, content });
};

export const parseMetadataTags = (elements: NodeListOf<HTMLMetaElement>, tagPrefix: string, tagCase: StringCase) => {
    // Tags need to be split and reformatted:
    //   - Must be alphanumeric (not numeric)
    //	 - May contain underscores or hyphens
    //   - Nested tags are separated by forward slashes (/)
    //	 - Tags are case-insensitive 
    const tags = new Set<FormatterArgs>();
    elements.forEach((e) => e.content
        .split(",")
        .forEach((text) => tags
            .add({ 
                prefix: tagPrefix, 
                tag: cleanTag(text, tagCase) 
            })));

    logger().debug("parsed tags", tags);
    return tags;
};

export const parseMetadata = (doc: Document, fmProps: TFrontMatterProps, tagPrefix: string, tagCase: StringCase): IArticleMetadata => {
    const metadata: IArticleMetadata = { tags: new Array<FormatterArgs>(), slurpedTime: new Date() };
    const tmpl = 'meta[name="{s}"], meta[property="{s}"], meta[itemprop="{s}"], meta[http-equiv="{s}"]';

    for (const i of fmProps) {
        const prop = i[1];
        const metaFields = new Set([...prop.metaFields || []]);
        logger().debug("attempting to parse prop metadata", prop);

        for (const attr of metaFields) {
            // tags need special handling, for everything else we just take the first result
            const querySelector = tmpl.replace('{s}', attr);
            const elements: NodeListOf<HTMLMetaElement> = doc.querySelectorAll(querySelector);
            logger().debug("found prop elements", attr, querySelector, elements);
            if (elements.length === 0) continue;

            if (prop.id === "tags") {
                logger().debug("parsing tags", { prop, elements, tagPrefix, tagCase, metaFields, querySelector });
                for (const val of parseMetadataTags(elements, tagPrefix, tagCase)) {
                    metadata.tags.push(val);
                }
            } else {
                // already found a match
                if (metadata[prop.id] !== undefined) continue;

                logger().debug("adding metadata", { prop, elements, metaFields, querySelector });
                metadata[prop.id] = elements[0].content;
            }
        }
    }

    return metadata;
};

const dedupeTags = (tagsA: IArticleTags[], tagsB: IArticleTags[]): IArticleTags[] => {
    const found = new Array<string>();
    const results: IArticleTags[] = [];
    for (const tag of [...tagsA, ...tagsB]) {
        if (found.length == 0 || !found.includes(tag.tag)){
            found.push(tag.tag);
            results.push(tag);
        }
    }
    return results;
}

export const mergeMetadata = (article: IArticle, metadata: IArticleMetadata): IArticle => {
    const merged = { ...article };

    // handle tags separately
    merged.tags = dedupeTags(article.tags, metadata.tags);

    // Iterate over the keys of objB
    for (const key in metadata) {
        if (key !== 'tags' && isEmpty(merged[key]) && !isEmpty(metadata[key]))
            merged[key] = metadata[key];
    }

    return merged;
};

const convertMathInSegment = (markdown: string): string => {
    let result = markdown;
    result = result.replace(/(^|\n)([\t ]*)\\\[([\s\S]*?)\\\][\t ]*(?=\n|$)/g, (match, leading, indent, content) => {
        return `${leading}${indent}$$${content}$$`;
    });
    result = result.replace(/\\\(([\s\S]*?)\\\)/g, (match, content) => `$${content}$`);
    return result;
};

export const convertMathDelimiters = (markdown: string): string => {
    // Convert LaTeX/MathJax inline math delimiters \(...\) to Obsidian format $...$
    // Convert LaTeX/MathJax block math delimiters \[...\] to Obsidian format $$...$$
    // Skip code spans and code blocks, and only convert block math at line boundaries.
    const codePattern = /```[\s\S]*?```|`[^`]*`/g;
    let result = '';
    let lastIndex = 0;

    for (const match of markdown.matchAll(codePattern)) {
        const start = match.index ?? 0;
        result += convertMathInSegment(markdown.slice(lastIndex, start));
        result += match[0];
        lastIndex = start + match[0].length;
    }

    result += convertMathInSegment(markdown.slice(lastIndex));
    return result;
};

export const parseMarkdown = (content: string): string => {
    const md = htmlToMarkdown(sanitizeHTMLToDom(content));
    if (!md) {
        logger().error(`Parsed content resulted in falsey markdown: ${md}`);
        throw new Error("Unable to convert content to Markdown.");
    }
    return convertMathDelimiters(md);
}
