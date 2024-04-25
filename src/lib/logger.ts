import type SlurpPlugin from "main";
import moment from "moment";
import { normalizePath, type Vault } from "obsidian";
import { DEFAULT_SETTINGS } from "../const";
import type { ILogSettings } from "../types";
import { serialize } from "./util";

interface LogMessage {
    msg: string;
    level: "debug" | "warn" | "error";
    caller?: string;
    optionalParams?: Array<unknown>;
    timestamp: number;
}

const MAX_BUFFER_SIZE = 100;

let _logger: Logger;

const staticLog = (msg: LogMessage) => {
    const msgStr = `[${msg.caller}] ${msg.msg}`;
    const fn = msg.level === "error"
        ? console.error
        : msg.level === "warn"
            ? console.warn
            : console.log;

    fn(msgStr, ...msg.optionalParams || []);
};

export const logger = () => _logger || {
    debug: (msg: string, ...optionalParams: unknown[]) => {
        const caller = Error().stack?.split('\n    at ').slice(1)?.at(-1);
        staticLog({ msg: msg, level: "debug", caller: caller, optionalParams: optionalParams, timestamp: new Date().getTime() });
    },

    warn: (msg: string, ...optionalParams: unknown[]) => {
        const caller = Error().stack?.split('\n    at ').slice(1)?.at(-1);
        staticLog({ msg: msg, level: "warn", caller: caller, optionalParams: optionalParams, timestamp: new Date().getTime() });
    },

    error: (msg: string, ...optionalParams: unknown[]) => {
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

    private sortBuffer = () => this.buffer.sort((a, b) => a.timestamp - b.timestamp);

    private bufferLog = (msg: LogMessage) => {
        this.sortBuffer();
        if (this.buffer.length >= MAX_BUFFER_SIZE)
            // pop would be more efficient, but with 100 items max and a 500ms
            // interval, the impact should be negligible.
            this.buffer.shift();
        this.buffer.push(msg);
    };

    private getOrCreateLogFile = async () => {
        const folder = this.vault.getFolderByPath(this.settings.logPath) || await this.vault.createFolder(this.settings.logPath);
        const file = normalizePath(`${folder.path}/slurp-${moment().format("YYYY-MM-DD")}.md`);
        return this.vault.getFileByPath(file) || await this.vault.create(file, `##### startup: ${new Date().toUTCString()}\n`);
    };

    dump = (returnCallback = true, limit = Number.POSITIVE_INFINITY, format: "markdown" = "markdown"): { content: string, onComplete: null | (() => void); } => {
        let content = "\n";
        const b = new Set(this.sortBuffer());

        for (let idx = 0; idx < this.buffer.length && idx < limit; idx++) {
            const msg = this.buffer[idx];
            const optJson = [];
            for (const i of msg.optionalParams || []) {
                optJson.push(JSON.stringify(serialize(i), undefined, 2));
            }
            content += `##### ${msg.timestamp} | ${msg.level.padStart(5).toUpperCase()} | ${msg.msg}\n` +
                `- Caller: \`${msg.caller}\`\n\n`;
            if (optJson.length > 0)
                content += `\`\`\`\n${optJson.join('\n')}\n\`\`\`\n\n`;
        };

        return {
            content, onComplete: returnCallback
                // biome-ignore lint/complexity/noForEach: <explanation>
                ? () => b.forEach((msg) => this.buffer.remove(msg))
                : null
        };
    };

    flush = async () => {
        if (this.buffer.length === 0 || !this.settings.debug) return;

        const file = await this.getOrCreateLogFile();

        console.log("flushing logs", this.buffer, file);

        const { content, onComplete } = this.dump();

        await this.vault.append(file, content);

        if (onComplete) onComplete();
    };

    private log = (msg: LogMessage) => {
        const msgStr = `[${msg.caller}] ${msg.msg}`;
        const fn = msg.level === "error"
            ? console.error
            : msg.level === "warn"
                ? console.warn
                : console.log;

        if (this.settings.debug || msg.level !== "debug")
            fn(msgStr, ...msg.optionalParams || []);

        this.bufferLog(msg);
    };

    debug = (msg: string, ...optionalParams: unknown[]) => {
        const caller = Error().stack?.split('\n    at ').slice(1)?.at(-1);
        this.log({ msg: msg, level: "debug", caller: caller, optionalParams: optionalParams, timestamp: new Date().getTime() });
    };

    warn = (msg: string, ...optionalParams: unknown[]) => {
        const caller = Error().stack?.split('\n    at ').slice(1)?.at(-1);
        this.log({ msg: msg, level: "warn", caller: caller, optionalParams: optionalParams, timestamp: new Date().getTime() });
    };

    error = (msg: string, ...optionalParams: unknown[]) => {
        const caller = Error().stack?.split('\n    at ').slice(1)?.at(-1);
        this.log({ msg: msg, level: "error", caller: caller, optionalParams: optionalParams, timestamp: new Date().getTime() });
    };
}