import moment from "moment";
import type { FormatterArgs } from "../types";
import { logger } from "./logger";

export const format = (tmpl: string, val: unknown) => {
    switch (tmpl.substring(0, 2)) {
        case 'b|':
            return formatBoolean(tmpl.substring(2), val as boolean);

        case 'd|':
            return formatDate(tmpl.substring(2), val as Date);

        case 's|':
            return formatString(tmpl.substring(2), val as string);

        case 'S|':
            return formatStrings(tmpl.substring(2), val as FormatterArgs[]);

        default:
            return formatString(tmpl, val as string);
    }
};

export const formatBoolean = (tmpl: string, val?: string | boolean) => {
    if (tmpl !== "" && !val)
        // trusting that the settings validation functions did their job properly
        return JSON.parse(tmpl.toLowerCase());

    if (typeof val === "string" && ['true', 'false'].contains(val.trim().toLowerCase()))
        return JSON.parse(val);

    if (typeof val === "boolean")
        return val;

    console.warn(`Unable to parse ${val} as a boolean, passing it back raw.`);
    return val;
};

export const formatDate = (t = "YYYY-MM-DDTHH:mm", v = new Date()) => {
    const result = moment(v).format(t);
    return Number.isNaN(+result) ? result : +result;
};

export const formatString = (tmpl: string, val: string) =>
    val
        ? formatStrings(tmpl, [{ s: val }])[0]
        : "";

export const formatStrings = (tmpl: string, val: Iterable<FormatterArgs>): Array<string> => {
    const result = new Array<string>();
    for (const i of val) {
        logger().debug("formatting string", { tmpl: tmpl, value: i });
        result.push(
            tmpl.replace(/\{(\w+)\}/g, (match, name) => {
                // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
                logger().debug("match found", { match: match, name: name, value: i[name], iHasName: i.hasOwnProperty(name) });
                return !i.hasOwnProperty(name)
                    ? match
                    : i[name] !== undefined
                        ? i[name]
                        : "";
            }
            ));
    }
    return result;
}

