import type SlurpPlugin from "main";
import moment from "moment";
import { normalizePath, type Vault } from "obsidian";
import { DEFAULT_SETTINGS } from "./const";
import type { ILogSettings } from "./types";
import { serialize } from "./util";

interface LogMessage {
    msg: string
    level: "debug" | "warn" | "error"
    caller?: string
    optionalParams?: Array<any>
    timestamp: number
}

const MAX_BUFFER_SIZE = 10 ^ 5;

let _logger: Logger;

const staticLog = (msg: LogMessage) => {
    const msgStr = `[${msg.caller}] ${msg.msg}`;
    const fn = msg.level === "error"
        ? console.error
        : msg.level === "warn"
            ? console.warn
            : console.log;

    fn(msgStr, ...msg.optionalParams || []);
}

export const logger = () => _logger || {
    debug: (msg: string, ...optionalParams: any[]) => {
        const caller = Error().stack?.split('\n    at ').slice(1)?.at(-1);
        staticLog({ msg: msg, level: "debug", caller: caller, optionalParams: optionalParams, timestamp: new Date().getTime() });
    },

    warn: (msg: string, ...optionalParams: any[]) => {
        const caller = Error().stack?.split('\n    at ').slice(1)?.at(-1);
        staticLog({ msg: msg, level: "warn", caller: caller, optionalParams: optionalParams, timestamp: new Date().getTime() });
    },

    error: (msg: string, ...optionalParams: any[]) => {
        const caller = Error().stack?.split('\n    at ').slice(1)?.at(-1);
        staticLog({ msg: msg, level: "error", caller: caller, optionalParams: optionalParams, timestamp: new Date().getTime() });
    }
};

export class Logger {
    private buffer = new Array<LogMessage>();
    private vault: Vault;
    private settings: ILogSettings;

    constructor(plugin: SlurpPlugin) {
        this.vault = plugin.app.vault;
        if (plugin.settings && Object.keys(plugin.settings).contains("logs")) {
            this.settings = plugin.settings.logs;
        } else
            this.settings = { debug: true, logPath: DEFAULT_SETTINGS.logs.logPath };

        if (this.settings.debug)
            plugin.registerInterval(window.setInterval(
                () => this.flush(), 500));

        _logger = this;
    }

    private bufferLog = (msg: LogMessage) => {
        this.buffer.sort((a, b) => a.timestamp - b.timestamp);
        if (this.buffer.length >= MAX_BUFFER_SIZE)
            this.buffer.pop();
        this.buffer.push(msg);
    }

    private getOrCreateLogFile = async () => {
        const folder = this.vault.getFolderByPath(this.settings.logPath) || await this.vault.createFolder(this.settings.logPath);
        const file = normalizePath(`${folder.path}/slurp-${moment().format("YYYY-MM-DD")}.md`);
        return this.vault.getFileByPath(file) || await this.vault.create(file, `##### startup: ${new Date().toUTCString()}\n`);
    };

    flush = async () => {
        if (this.buffer.length == 0) return;

        const file = await this.getOrCreateLogFile();

        if (this.settings.debug) console.log(`flushing logs`, this.buffer, file);

        const b = new Set(this.buffer);
        let content = "\n";

        b.forEach((msg) => {
            let optJson = [];
            for (let i of msg.optionalParams || []) {
                optJson.push(JSON.stringify(serialize(i), undefined, 2));
            }
            content += `##### [${msg.level.padStart(5)}] ${msg.msg}\n` +
                `> \`${msg.caller}\`\n> ${msg.timestamp}\n\n`
            if (optJson.length > 0)
                content += "```\n" + `${optJson.join('\n')}\n` + "```\n\n";
        });


        await this.vault.append(file, content);

        b.forEach((msg) => this.buffer.remove(msg));
    };

    private log = (msg: LogMessage) => {
        if (!this.settings.debug && msg.level == "debug") return;

        const msgStr = `[${msg.caller}] ${msg.msg}`;
        const fn = msg.level === "error"
            ? console.error
            : msg.level === "warn"
                ? console.warn
                : console.log;

        fn(msgStr, ...msg.optionalParams || []);
        if (this.settings.debug) this.bufferLog(msg);
    }

    debug = (msg: string, ...optionalParams: any[]) => {
        const caller = Error().stack?.split('\n    at ').slice(1)?.at(-1);
        this.log({ msg: msg, level: "debug", caller: caller, optionalParams: optionalParams, timestamp: new Date().getTime() });
    }

    warn = (msg: string, ...optionalParams: any[]) => {
        const caller = Error().stack?.split('\n    at ').slice(1)?.at(-1);
        this.log({ msg: msg, level: "warn", caller: caller, optionalParams: optionalParams, timestamp: new Date().getTime() });
    }

    error = (msg: string, ...optionalParams: any[]) => {
        const caller = Error().stack?.split('\n    at ').slice(1)?.at(-1);
        this.log({ msg: msg, level: "error", caller: caller, optionalParams: optionalParams, timestamp: new Date().getTime() });
    }
}