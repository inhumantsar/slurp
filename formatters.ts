import moment from "moment";
import type { IFormatterArgs } from "types";

export const format = (tmpl: string, val: any) => {
    let result;
    switch (tmpl.substring(0, 2)) {
        case 'd|':
            result = formatDate(tmpl.substring(2), val);
            break;

        case 's|':
            result = formatString(tmpl.substring(2), val);
            break;

        case 'S|':
            result = formatStrings(tmpl.substring(2), val);
            break;

        default:
            result = formatString(tmpl, val);
            break;
    }
    console.log(result);
    return result;
}

export const formatDate = (t = "YYYY-MM-DDTHH:mm", v = new Date()) => {
    return moment(v).format(t);
}

export const formatString = (tmpl: string, val: any) => formatStrings(tmpl, [{ s: val }])[0];

export const formatStrings = (tmpl: string, val: Iterable<IFormatterArgs>): Array<string> => {
    const result = new Array<string>();
    for (let i of val) {
        const s = tmpl.replace(/\{(\w+)\}/g, (match, name) => {
            return i.hasOwnProperty(name) ? i[name] : match;
        });
        console.log(`adding formatting result ${s}`);
        result.push(s);
    }
    return result;
}

