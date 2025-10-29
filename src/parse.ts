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
        .replace(/(href|src)="\/([^\/].*?)"/g, `$1="${url.origin}/$2"`)
        // Handles relative paths
        .replace(/(href|src)="([^\/].*?)"/g, (match, p1, p2) => {
            // Check if it's a protocol-relative URL (starts with //) or has a protocol
            if (/^\/\//.test(p2) || /^[a-z][a-z0-9+.-]*:/.test(p2)) {
                return match; // return original if it's protocol-relative or has a protocol
            }
            return `${p1}="${new URL(p2, url.href)}"`;
        });
};

export const fetchHtml = async (url: string) => {
    const html = await requestUrl(url).text;
    if (!html) {
        logger().error(`Unable to fetch page from: ${url}.`);
        throw "Unable to fetch page.";
    }
    return fixRelativeLinks(html, url);
};

export const parsePage = (doc: Document) => {
    const article = new Readability(doc).parse();

    if (!article || !article.title || !article.content) {
        logger().error("Parsed article missing critical content", article);
        throw "No title or content found.";
    }
    return article;
};

export const parseMetadataTags = (elements: NodeListOf<HTMLMetaElement>, tagPrefix: string, tagCase: StringCase) => {
    // Tags need to be split and reformatted:
    //   - Must be alphanumeric (not numeric)
    //	 - May contain underscores or hyphens
    //   - Nested tags are separated by forward slashes (/)
    //	 - Tags are case-insensitive 
    const tags = new Set<FormatterArgs>();
    // biome-ignore lint/complexity/noForEach: <explanation>
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
    };

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

export const convertMathDelimiters = (markdown: string): string => {
    // Convert LaTeX/MathJax inline math delimiters \(...\) to Obsidian format $...$
    // Convert LaTeX/MathJax block math delimiters \[...\] to Obsidian format $$...$$
    let result = markdown;
    
    // Convert block math first to avoid conflicts with inline math
    // Using a function to avoid issues with $ in replacement strings
    result = result.replace(/\\\[([\s\S]*?)\\\]/g, (match, p1) => `$$${p1}$$`);
    
    // Convert inline math
    result = result.replace(/\\\(([\s\S]*?)\\\)/g, (match, p1) => `$${p1}$`);
    
    return result;
};

export const parseMarkdown = (content: string): string => {
    const md = htmlToMarkdown(sanitizeHTMLToDom(content));
    if (!md) {
        logger().error(`Parsed content resulted in falsey markdown: ${md}`);
        throw "Unable to convert content to Markdown.";
    }
    return convertMathDelimiters(md);
}

