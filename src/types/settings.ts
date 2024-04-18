import type { StringCase } from "src/string-case"

export interface SlurpSettings {
    showEmptyProps: boolean
    parseTags: boolean
    tagPrefix: string
    tagCase: StringCase
    propSettings: SlurpPropSettings
    debug: boolean
}

export interface SlurpPropSetting {
    id: string;
    enabled?: boolean;
    key?: string;
    idx?: number;
    format?: string;
    custom: boolean;
}

export type SlurpPropSettings = { [s: string]: SlurpPropSetting }
