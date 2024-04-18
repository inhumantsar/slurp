export interface ISlurpProp<T> {
    id: string;
    enabled?: boolean;
    key?: string;
    idx?: number;
    format?: string;
    defaultIdx?: number;
    defaultKey?: string;
    description?: string;
    metaFields?: string[];
    custom: boolean;
    defaultFormat?: string;
    defaultValue?: SlurpPropDefault<T>;
}
export type SlurpPropDefault<T> = T | (() => T);

