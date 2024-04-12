export interface SlurpSettings {
    showEmptyProps: boolean
    parseTags: boolean
    tagPrefix: string
    tagCase: TagCase
    propSettings: SlurpPropSetting[]
}

export interface SlurpArticleMetadata {
    tags: Set<string>;
    excerpt?: string;
    byline?: string;
    siteName?: string;
    publishedTime?: string;
    modifiedTime?: string;
    type?: string;
    twitter?: string;
    onion?: string;
    link?: string;
}

export interface SlurpArticle extends SlurpArticleMetadata {
    title: string;
    content: string;
}

export interface SlurpCallbackArgs {
    url: string;
    article?: SlurpArticle;
    err?: string;
}

// overkill atm but hey
export interface SlurpUrlParams {
    url: string
}

export const TAG_CASES = ["camelCase", "PascalCase", "snake_case", "kebab-case", "iKebab-case"] as const;
export type TagCase = typeof TAG_CASES[number];

export interface SlurpPropSetting {
    id: string 					// for internal use
    idx: number					// index for ordering in notes, top-down.
    key: string					// prop name used in notes
    defaultKey: string
    metaFields: Set<string>		// <meta> attrs to check
    description: string			// for use in settings and note prop comments
    enabled: boolean			// whether to parse + write to notes
    format?: string				// optional format, mainly for dates
}

