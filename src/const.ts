import { createFrontMatterPropSettings, createFrontMatterProps } from "src/frontmatter";
import type { IFrontMatterPropDefault, ISettings, TFrontMatterPropDefaults } from "./types";

export const FRONT_MATTER_ITEM_DEFAULTS: TFrontMatterPropDefaults = new Map<string, IFrontMatterPropDefault>([
    {
        id: "link", defaultIdx: 0, defaultKey: "link",
        description: 'Page URL provided or a permalink discovered in metadata.',
        metaFields: ['url', 'og:url', 'parsely-link', 'twitter:url']
    },
    {
        defaultIdx: 1, id: "byline", defaultKey: "byline",
        description: 'Name of the primary author or the first author detected.',
        metaFields: ['author', 'article:author', 'parsely-author', 'cXenseParse:author']
    },
    {
        defaultIdx: 2, id: "siteName", defaultKey: "site",
        description: 'Website or publication name.',
        metaFields: ['og:site_name', 'page.content.source', 'application-name', 'apple-mobile-web-app-title', 'twitter:site']
    },
    {
        defaultIdx: 3, id: "publishedTime", defaultKey: "date",
        description: 'Date/time that the page was initially published.',
        metaFields: ['article:published_time', 'parsely-pub-date', 'datePublished', 'article.published'],
        defaultFormat: "d|YYYY-MM-DDTHH:mm"
    },
    {
        defaultIdx: 4, id: "modifiedTime", defaultKey: "updated",
        description: 'Date/time that the page was last modified, if available.',
        metaFields: ['article:modified_time', 'dateModified', 'dateLastPubbed'],
        defaultFormat: "d|YYYY-MM-DDTHH:mm"
    },
    {
        defaultIdx: 5, id: "type", defaultKey: "type",
        description: 'Type of publication, eg: "page", "post", "article".',
        metaFields: ['og:type', 'parsely-type', 'medium', 'page.content.type']
    },
    {
        defaultIdx: 6, id: "excerpt", defaultKey: "excerpt",
        description: 'Often used for subtitles, excerpts, descriptions, and abstracts.',
        metaFields: ['description', 'og:description', 'twitter:description']
    },
    {
        defaultIdx: 7, id: "twitter", defaultKey: "twitter",
        description: 'Twitter/X link for the author or site.',
        metaFields: ['twitter:creator', 'twitter:site'],
        defaultFormat: 's|https://twitter.com/{s}'
    },
    {
        defaultIdx: 8, id: "tags", defaultKey: "tags",
        description: "Tags and keywords present in the page's metadata.",
        metaFields: ['tags', 'keywords', 'article:tag', 'parsely-tags', 'news_keywords'],
        defaultFormat: "S|{prefix}/{tag}"
    },
    {
        defaultIdx: 9, id: "onion", defaultKey: "onion",
        description: 'Link to a mirror of the content on Tor.',
        metaFields: ['onion-location']
    },
    {
        defaultIdx: 10, id: "slurped", defaultKey: "slurped",
        description: 'Date/time that the page was accessed by Slurp.',
        defaultFormat: 'd|YYYY-MM-DDTHH:mm',
        defaultValue: () => new Date()
    },
    {
        defaultIdx: 11, id: "title", defaultKey: "title",
        description: 'Page title as seen in the browser, falling back to the title presented in metadata.',
        metaFields: ['og:title', 'twitter:title']
    },
].map((item) => [item.id, item]));

const FRONT_MATTER_ITEM_DEFAULT_SETTINGS = createFrontMatterPropSettings(createFrontMatterProps());

export const DEFAULT_SETTINGS: ISettings = {
    settingsVersion: 1,
    defaultPath: "Slurped Pages",
    fm: {
        includeEmpty: false,
        tags: {
            parse: true,
            prefix: 'slurp/',
            case: "iKebab-case"
        },
        properties: FRONT_MATTER_ITEM_DEFAULT_SETTINGS
    },
    logs: { logPath: "_slurplogs", debug: false }
}