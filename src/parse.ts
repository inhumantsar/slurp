import { Readability } from "@mozilla/readability";
import { requestUrl, htmlToMarkdown, sanitizeHTMLToDom } from "obsidian";
import { formatString } from "./formatters";
import type { SlurpArticleMetadata, SlurpArticle } from "./types/article";
import type { FormatterArgs } from "./types/misc";
import type { SlurpProps } from "./slurp-prop";
import { isEmpty, updateStringCase } from "./util";
import type { StringCase } from "./string-case";

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
}

export const fetchHtml = async (url: string) => {
    const html = await requestUrl(url).text;
    if (!html) {
        console.error(`[Slurp] Unable to fetch page from: ${url}.`);
        throw `Unable to fetch page.`;
    }
    return fixRelativeLinks(html, url)
}

export const parsePage = (doc: Document) => {
    const article = new Readability(doc).parse();

    if (!article || !article.title || !article.content) {
        console.error(`[Slurp] Parsed article missing critical content: ${article}.`);
        throw "No title or content found.";
    }
    return article;
}

export const parseMetadataTags = (elements: NodeListOf<HTMLMetaElement>, tagPrefix: string, tagCase: StringCase) => {
    // Tags need to be split and reformatted:
    //   - Must be alphanumeric (not numeric)
    //	 - May contain underscores or hyphens
    //   - Nested tags are separated by forward slashes (/)
    //	 - Tags are case-insensitive 
    const tags = new Set<FormatterArgs>();
    elements.forEach((e) => e.content
        .split(",")
        .forEach((text) => tags.add({ prefix: tagPrefix, tag: updateStringCase(text.trim(), tagCase) })));
    console.debug(tags);
    return tags;
}

export const parseMetadata = (doc: Document, slurpProps: SlurpProps, tagPrefix: string, tagCase: StringCase): SlurpArticleMetadata => {
    const metadata: SlurpArticleMetadata = { tags: new Set<FormatterArgs>(), slurpedTime: new Date() };
    const tmpl = 'meta[name="{s}"], meta[property="{s}"], meta[itemprop="{s}"], meta[http-equiv="{s}"]';

    for (let i in slurpProps) {
        const prop = slurpProps[i];

        const metaFields = new Set([...prop.metaFields || [], ...prop.extraMetaFields || []]);

        metaFields.forEach((attr) => {
            // tags need special handling, for everything else we just take the first result
            const elements: NodeListOf<HTMLMetaElement> = doc.querySelectorAll(formatString(tmpl, attr));
            if (elements.length == 0) return;

            if (prop.id == "tags") {
                parseMetadataTags(elements, tagPrefix, tagCase).forEach((val) => metadata.tags.add(val));
            } else {
                // already found a match
                if (metadata[prop.id] != undefined) return;

                metadata[prop.id] = elements[0].content;
            }
        });
    };

    return metadata;
}

export const mergeMetadata = (article: SlurpArticle, metadata: SlurpArticleMetadata): SlurpArticle => {
    const merged = { ...article };

    // handle tags separately
    merged.tags = new Set([...article.tags, ...metadata.tags]);

    // Iterate over the keys of objB
    for (const key in metadata) {
        if (key !== 'tags' && isEmpty(merged[key]) && !isEmpty(metadata[key]))
            merged[key] = metadata[key];
    }

    return merged;
}

export const parseMarkdown = (content: string): string => {
    const md = htmlToMarkdown(sanitizeHTMLToDom(content));
    if (!md) {
        console.error(`[Slurp] Parsed content resulted in falsey markdown: ${md}`);
        throw "Unable to convert content to Markdown.";
    }
    return md;
}

