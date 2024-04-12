import type { SlurpSettings, SlurpPropSetting } from "types";


export const DEFAULT_PROP_SETTINGS: SlurpPropSetting[] = [
    {
        id: 'link', idx: 0, key: 'link', defaultKey: 'link', enabled: true,
        description: 'Page URL provided or the discovered permalink.',
        metaFields: new Set(['url', 'og:url', 'parsely-link', 'twitter:url'])
    },
    {
        id: 'byline', idx: 1, key: 'author', defaultKey: 'author', enabled: true,
        description: 'Name of the primary or first detected author.',
        metaFields: new Set(['author', 'article:author', 'parsely-author', 'cXenseParse:author'])
    },
    {
        id: 'siteName', idx: 2, key: 'site', defaultKey: 'site', enabled: true,
        description: 'Website or publication name.',
        metaFields: new Set(['og:site_name', 'page.content.source', 'application-name', 'apple-mobile-web-app-title', 'twitter:site'])
    },
    {
        id: 'publishedTime', idx: 3, key: 'date', defaultKey: 'date', enabled: true,
        description: 'Date (and time when present) of initial publication.',
        metaFields: new Set(['article:published_time', 'parsely-pub-date', 'datePublished', 'article.published']),
        format: "YYYY-MM-DDTHH:mm"
    },
    {
        id: 'modifiedTime', idx: 4, key: 'updated', defaultKey: 'updated', enabled: true,
        description: 'Date (and time when present) the page was last modified, if available.',
        metaFields: new Set(['article:modified_time', 'dateModified', 'dateLastPubbed']),
        format: "YYYY-MM-DDTHH:mm"
    },
    {
        id: 'type', idx: 5, key: 'type', defaultKey: 'type', enabled: true,
        description: 'Type of publication if available, eg: "page", "post", "article".',
        metaFields: new Set(['og:type', 'parsely-type', 'medium', 'page.content.type'])
    },
    {
        id: 'excerpt', idx: 6, key: 'excerpt', defaultKey: 'excerpt', enabled: true,
        description: 'Excerpt, summary, subtitle, or description.',
        metaFields: new Set(['description', 'og:description', 'twitter:description'])
    },
    {
        id: 'twitter', idx: 7, key: 'twitter', defaultKey: 'twitter', enabled: true,
        description: 'Twitter/X link for the author or site.',
        metaFields: new Set(['twitter:creator', 'twitter:site']),
        format: 'https://twitter.com/{s}'
    },
    {
        id: 'tags', idx: 8, key: 'tags', defaultKey: 'tags', enabled: true,
        description: 'Tags and keywords. See also Tag Prefix.',
        metaFields: new Set(['twitter:creator', 'twitter:site'])
    },
    {
        id: 'onion', idx: 9, key: 'onion', defaultKey: 'onion', enabled: true,
        description: 'Link to a mirror of the content on Tor.',
        metaFields: new Set(['onion-location'])
    }
];

export const DEFAULT_SETTINGS: SlurpSettings = {
    showEmptyProps: false,
    parseTags: true,
    tagPrefix: "slurp/",
    tagCase: "iKebab-case",
    propSettings: DEFAULT_PROP_SETTINGS
}
