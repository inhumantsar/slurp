import type { SlurpPropSettings, SlurpSettings } from "src/types/settings";
import { SlurpProp, type SlurpProps } from "src/slurp-prop";

export const DEFAULT_SLURP_PROPS: SlurpProps = {
    link: new SlurpProp<string>({
        id: "link", defaultIdx: 0, defaultKey: "link", enabled: true, description: 'Page URL provided or a permalink discovered in metadata.',
        metaFields: ['url', 'og:url', 'parsely-link', 'twitter:url'], custom: false
    }),
    byline: new SlurpProp<string>({
        defaultIdx: 1, id: "byline", defaultKey: "byline", enabled: true, description: 'Name of the primary author or the first author detected.',
        metaFields: ['author', 'article:author', 'parsely-author', 'cXenseParse:author'], custom: false
    }),
    siteName: new SlurpProp<string>({
        defaultIdx: 2, id: "siteName", defaultKey: "site", enabled: true, description: 'Website or publication name.',
        metaFields: ['og:site_name', 'page.content.source', 'application-name', 'apple-mobile-web-app-title', 'twitter:site'], custom: false
    }),
    publishedTime: new SlurpProp<Date>({
        defaultIdx: 3, id: "publishedTime", defaultKey: "date", enabled: true, description: 'Date/time that the page was initially published.',
        metaFields: ['article:published_time', 'parsely-pub-date', 'datePublished', 'article.published'], defaultFormat: "d|YYYY-MM-DDTHH:mm", custom: false
    }),
    modifiedTime: new SlurpProp<Date>({
        defaultIdx: 4, id: "modifiedTime", defaultKey: "updated", enabled: true,
        description: 'Date/time that the page was last modified, if available.', metaFields: ['article:modified_time', 'dateModified', 'dateLastPubbed'],
        defaultFormat: "d|YYYY-MM-DDTHH:mm", custom: false
    }),
    type: new SlurpProp<string>({
        defaultIdx: 5, id: "type", defaultKey: "type", enabled: true, description: 'Type of publication, eg: "page", "post", "article".',
        metaFields: ['og:type', 'parsely-type', 'medium', 'page.content.type'], custom: false
    }),
    excerpt: new SlurpProp<string>({
        defaultIdx: 6, id: "excerpt", defaultKey: "excerpt", enabled: true, description: 'Often used for subtitles, excerpts, descriptions, and abstracts.',
        metaFields: ['description', 'og:description', 'twitter:description'], custom: false
    }),
    twitter: new SlurpProp<string>({
        defaultIdx: 7, id: "twitter", defaultKey: "twitter", enabled: true, description: 'Twitter/X link for the author or site.',
        metaFields: ['twitter:creator', 'twitter:site'], defaultFormat: 's|https://twitter.com/{s}', custom: false
    }),
    tags: new SlurpProp<Iterable<string>>({
        defaultIdx: 8, id: "tags", defaultKey: "tags", enabled: true, description: "Tags and keywords present in the page's metadata.",
        metaFields: ['tags', 'keywords', 'article:tag', 'parsely-tags', 'news_keywords'], defaultFormat: "S|{prefix}/{tag}", custom: false
    }),
    onion: new SlurpProp<string>({
        defaultIdx: 9, id: "onion", defaultKey: "onion", enabled: true, description: 'Link to a mirror of the content on Tor.',
        metaFields: ['onion-location'], custom: false
    }),
    slurped: new SlurpProp<Date>({
        defaultIdx: 10, id: "slurped", defaultKey: "slurped", enabled: true, description: 'Date/time that the page was accessed by Slurp.',
        defaultFormat: 'd|YYYY-MM-DDTHH:mm', defaultValue: () => new Date(), custom: false
    }),
    title: new SlurpProp<Date>({
        defaultIdx: 11, id: "title", defaultKey: "title", enabled: true, description: 'Page title as seen in the browser, falling back to the title presented in metadata.',
        metaFields: ['og:title', 'twitter:title'], custom: false
    }),
}

const DEFAULT_SLURP_PROP_SETTINGS: SlurpPropSettings = {};
for (let i in DEFAULT_SLURP_PROPS) {
    DEFAULT_SLURP_PROP_SETTINGS[i] = DEFAULT_SLURP_PROPS[i].getSetting();
}

export const DEFAULT_SETTINGS: SlurpSettings = {
    showEmptyProps: false,
    parseTags: true,
    tagPrefix: "slurp/",
    tagCase: "iKebab-case",
    propSettings: DEFAULT_SLURP_PROP_SETTINGS,
    debug: false
}

export const DEFAULT_PATH: string = "Slurped Pages";