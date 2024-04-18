export interface SlurpArticleTags { [s: string]: string }

export interface SlurpArticleMetadata {
    [property: string]: any;
    slurpedTime: Date;
    tags: Set<SlurpArticleTags>;
    excerpt?: string;
    byline?: string;
    siteName?: string;
    publishedTime?: string | number;
    modifiedTime?: string | number;
    type?: string;
    twitter?: string;
    onion?: string;
    link?: string;
}

export interface SlurpArticle extends SlurpArticleMetadata {
    [property: string]: any;
    title: string;
    content: string;
}

