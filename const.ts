import { type SlurpPropSettings, type SlurpProps, type SlurpSettings } from "types";
import { SlurpProp } from "types";
import { formatString, formatDate } from 'formatters';



export const DEFAULT_SLURP_PROPS: SlurpProps = {
    link: new SlurpProp<string>({
        id: "link", defaultIdx: 0, defaultKey: "link", enabled: true, description: 'Page URL provided or the discovered permalink.',
        metaFields: ['url', 'og:url', 'parsely-link', 'twitter:url']
    }),
    byline: new SlurpProp<string>({
        defaultIdx: 1, id: "byline", defaultKey: "byline", enabled: true, description: 'Name of the primary or first detected author.',
        metaFields: ['author', 'article:author', 'parsely-author', 'cXenseParse:author']
    }),
    siteName: new SlurpProp<string>({
        defaultIdx: 2, id: "siteName", defaultKey: "site", enabled: true, description: 'Website or publication name.',
        metaFields: ['og:site_name', 'page.content.source', 'application-name', 'apple-mobile-web-app-title', 'twitter:site']
    }),
    publishedTime: new SlurpProp<Date>({
        defaultIdx: 3, id: "publishedTime", defaultKey: "date", enabled: true, description: 'Date (and time when present) of initial publication.',
        metaFields: ['article:published_time', 'parsely-pub-date', 'datePublished', 'article.published'], defaultFormat: "d|YYYY-MM-DDTHH:mm"
    }),
    modifiedTime: new SlurpProp<Date>({
        defaultIdx: 4, id: "modifiedTime", defaultKey: "updated", enabled: true,
        description: 'Date (and time when present) the page was last modified, if available.', metaFields: ['article:modified_time', 'dateModified', 'dateLastPubbed'],
        defaultFormat: "d|YYYY-MM-DDTHH:mm"
    }),
    type: new SlurpProp<string>({
        defaultIdx: 5, id: "type", defaultKey: "type", enabled: true, description: 'Type of publication if available, eg: "page", "post", "article".',
        metaFields: ['og:type', 'parsely-type', 'medium', 'page.content.type']
    }),
    excerpt: new SlurpProp<string>({
        defaultIdx: 6, id: "excerpt", defaultKey: "excerpt", enabled: true, description: 'Excerpt, summary, subtitle, or description.',
        metaFields: ['description', 'og:description', 'twitter:description']
    }),
    twitter: new SlurpProp<string>({
        defaultIdx: 7, id: "twitter", defaultKey: "twitter", enabled: true, description: 'Twitter/X link for the author or site.',
        metaFields: ['twitter:creator', 'twitter:site'], defaultFormat: 's|https://twitter.com/{s}'
    }),
    tags: new SlurpProp<Iterable<string>>({
        defaultIdx: 8, id: "tags", defaultKey: "tags", enabled: true, description: 'Tags and keywords. See also Tag Prefix.',
        metaFields: ['tags', 'keywords', 'article:tag', 'parsely-tags', 'news_keywords'], defaultFormat: "S|{prefix}/{tag}"
    }),
    onion: new SlurpProp<string>({
        defaultIdx: 9, id: "onion", defaultKey: "onion", enabled: true, description: 'Link to a mirror of the content on Tor.',
        metaFields: ['onion-location']
    }),
    slurped: new SlurpProp<Date>({
        defaultIdx: 10, id: "slurped", defaultKey: "slurped", enabled: true, description: 'Download date/time',
        defaultFormat: 'd|YYYY-MM-DDTHH:mm', defaultValue: () => new Date()
    }),
    title: new SlurpProp<Date>({
        defaultIdx: 11, id: "title", defaultKey: "title", enabled: true, description: 'Page title',
        metaFields: ['og:title', 'twitter:title']
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