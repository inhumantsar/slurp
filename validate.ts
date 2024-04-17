import { SlurpProp } from "types";

const validateKey = (p: SlurpProp<any>): string[] => {
    const e = new Array<string>();
    if (!p.key && !p.defaultKey)
        e.push("All properties must have a key.");
    if (p.key?.match(/^[^\p{L}0-9]|[^\p{L}0-9]$/gu) !== null)
        e.push("Property keys must begin and end with alphanumeric characters.");
    if (p.key?.match(/[^\p{L}0-9._\-]/gu) !== null)
        e.push("Property keys may only contain alphanumeric characters, dots, dashes, and underscores.");
    return e;
}

const validateFormatMultiString = (p: SlurpProp<any>): string[] => {
    const e = new Array<string>();
    const fmt = p.format;
    const def = p.defaultFormat;
    const isMultiString = fmt?.startsWith("S|");
    const reqMultiString = def?.startsWith("S|");

    if (isMultiString && !reqMultiString)
        e.push("Multi-string formats can only be used with supported properties.");

    if (!isMultiString && reqMultiString)
        e.push("The format string for this property must start with 'S|'.");
    if (isMultiString && reqMultiString) {
        const matches = def?.match(/(\{\w+\})/g);
        if (!matches?.some((val) => fmt?.contains(val)))
            e.push(`This format string must contain at least one of ${matches?.join(", ")}.`);
    }
    return e
}

const validateFormat = (p: SlurpProp<any>): string[] => {
    const e = new Array<string>();
    const fmt = p.format;
    if (fmt?.match(/^[dsS]\|/) === null)
        e.push("Format strings must begin with a type identifier: 'd|' for dates or 's|' for strings. ");

    if (fmt?.startsWith("s|") && !fmt?.contains("{s}"))
        e.push("String formats must contain at least one replacement placeholder '{s}'");

    return [...e, ...validateFormatMultiString(p)]
}

export interface ISlurpPropValidationErrors {
    format: string[]
    key: string[]
}

export const validateSlurpProps = (props: Array<SlurpProp<any>>, onValidate: (props: Array<SlurpProp<any>>) => void) => {
    const errs = props.map((prop) => Object.assign({}, { format: validateFormat(prop), key: validateKey(prop) }))

    const errsExist = (errs.some((prop) => prop.format.length > 0 || prop.key.length > 0));
    if (!errsExist) onValidate(props);

    return errs;
};