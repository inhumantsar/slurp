import type { SlurpArticle } from "src/types/article";

export interface SlurpCallbackArgs {
    url: string;
    article?: SlurpArticle;
    err?: string;
}

// overkill atm but hey
export interface SlurpUrlParams {
    url: string
}

export interface FormatterArgs { [s: string]: string }
