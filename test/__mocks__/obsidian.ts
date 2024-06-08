//
// This is an example copied from https://github.com/obsidian-tasks-group/obsidian-tasks
//

import { JSDOM } from "jsdom";
import type { FileStats, TAbstractFile } from "obsidian";
import { instance, mock } from "ts-mockito";
import { getRandomName } from "../util/get-random-name";

export { };

const mockFileStats = mock<FileStats>();

export class TFile {
    parent: TFolder;
    name: string;
    path: string;
    vault: Vault;
    stat: FileStats = instance(mockFileStats);
    basename: string;
    extension: string;
    toJSON: () => unknown;

    constructor(parent: TFolder) {
        this.name = getRandomName();
        this.path = `${parent.path}/${this.name}.md`;
        this.parent = parent;
        this.basename = this.name;
        this.extension = ".md";
        this.vault = new Vault;

        // jest chokes on circular references *and* it ignores toJSON class methods 
        // https://github.com/jestjs/jest/issues/11958#issuecomment-1595762927
        this.toJSON = () => {
            return {
                name: this.name,
                path: this.path,
                parent: this.parent,
            };
        };
    }

}

export class TFolder implements TAbstractFile {
    name: string;
    path: string;
    children: TAbstractFile[];
    vault: Vault;
    parent: TFolder | null;
    toJSON: () => unknown;

    constructor(parent?: TFolder) {
        if (parent === undefined) {
            this.name = "";
            this.path = "/";
            this.parent = null;
        } else {
            this.name = getRandomName();
            this.path = `${parent.path === "/" ? "" : parent.path}/${this.name}`;
            this.parent = parent;
        }
        this.children = [];
        this.vault = new Vault;

        // jest chokes on circular references *and* it ignores toJSON class methods 
        // https://github.com/jestjs/jest/issues/11958#issuecomment-1595762927
        this.toJSON = () => {
            return {
                name: this.name,
                path: this.path,
                parent: this.parent,
            };
        };
    }

    isRoot() {
        return this.parent === undefined;
    }
}

const mockTree = (parent?: TFolder, depth = 0) => {
    const n = Math.floor(Math.random() * 10);
    const root = new TFolder(parent);
    for (let i = 0; i < n; i++) {
        root.children.push(Math.random() < 0.7 || depth >= 3
            ? new TFolder(root)
            : mockTree(root, depth + 1));
    }
    return root;
};

function flattenTree(node: TFolder): TFolder[] {
    let result: TFolder[] = [node];
    for (const child of node.children) {
        result = result.concat(flattenTree(child as TFolder));
    }
    return result;
}

export class Vault {
    tree: TFolder;
    dirs: TFolder[];
    files: TFile[];

    constructor() {
        // create a mock directory tree with nested subfolders
        // also populates a flat list of all dirs
        this.tree = mockTree();
        this.dirs = flattenTree(this.tree);
        // create a large list of files
        this.files = new Array<TFile>();
        for (const dir of this.dirs) {
            while (Math.random() < 0.95) {
                const f = new TFile(dir);
                this.files.push(f);
                dir.children.push(f);
            }
        }
    }

    getRoot() {
        return this.tree;
    }

    getFiles() {
        return this.files;
    }

    // stubs below taken directly from obsidian's Vault class
    // @ts-ignore    
    adapter: DataAdapter;
    // @ts-ignore    
    configDir: string;
    // @ts-ignore    
    getName(): string;
    // @ts-ignore    
    getFileByPath(path: string): TFile | null;
    // @ts-ignore    
    getFolderByPath(path: string): TFolder | null;
    // @ts-ignore    
    getAbstractFileByPath(path: string): TAbstractFile | null;
    // @ts-ignore    
    create(path: string, data: string, options?: DataWriteOptions): Promise<TFile>;
    // @ts-ignore    
    createBinary(path: string, data: ArrayBuffer, options?: DataWriteOptions): Promise<TFile>;
    // @ts-ignore    
    createFolder(path: string): Promise<TFolder>;
    // @ts-ignore    
    read(file: TFile): Promise<string>;
    // @ts-ignore    
    cachedRead(file: TFile): Promise<string>;
    // @ts-ignore    
    readBinary(file: TFile): Promise<ArrayBuffer>;
    // @ts-ignore    
    getResourcePath(file: TFile): string;
    // @ts-ignore    
    delete(file: TAbstractFile, force?: boolean): Promise<void>;
    // @ts-ignore    
    trash(file: TAbstractFile, system: boolean): Promise<void>;
    // @ts-ignore    
    rename(file: TAbstractFile, newPath: string): Promise<void>;
    // @ts-ignore    
    modify(file: TFile, data: string, options?: DataWriteOptions): Promise<void>;
    // @ts-ignore    
    modifyBinary(file: TFile, data: ArrayBuffer, options?: DataWriteOptions): Promise<void>;
    // @ts-ignore    
    append(file: TFile, data: string, options?: DataWriteOptions): Promise<void>;
    // @ts-ignore    
    process(file: TFile, fn: (data: string) => string, options?: DataWriteOptions): Promise<string>;
    // @ts-ignore    
    copy(file: TFile, newPath: string): Promise<TFile>;
    // @ts-ignore    
    getAllLoadedFiles(): TAbstractFile[];
    // @ts-ignore    
    static recurseChildren(root: TFolder, cb: (file: TAbstractFile) => any): void;
    // @ts-ignore    
    getMarkdownFiles(): TFile[];
    // @ts-ignore    
    on(name: 'create', callback: (file: TAbstractFile) => any, ctx?: any): EventRef;
    // @ts-ignore    
    on(name: 'modify', callback: (file: TAbstractFile) => any, ctx?: any): EventRef;
    // @ts-ignore    
    on(name: 'delete', callback: (file: TAbstractFile) => any, ctx?: any): EventRef;
    // @ts-ignore    
    on(name: 'rename', callback: (file: TAbstractFile, oldPath: string) => any, ctx?: any): EventRef;
    // @ts-ignore    
    off();
    // @ts-ignore    
    offref();
    // @ts-ignore    
    trigger();
    // @ts-ignore    
    tryTrigger();
}

export class App {
    vault: Vault;

    constructor() {
        this.vault = new Vault();
    }
}

export class AbstractInputSuggest<T> {
    public app: App;
    public textInputEl: HTMLDivElement | HTMLInputElement;
    close: () => void;
    setValue: (value: string) => void;

    constructor(app: App, textInputEl: HTMLDivElement | HTMLInputElement) {
        this.textInputEl = textInputEl;
        this.app = app;
        this.close = jest.fn();
        // annoyingly this doesn't get applied to the descendent class being tested. 
        this.setValue = jest.fn();
    }

}

export class TextComponent {
    public containerEl: HTMLElement;
    inputEl: HTMLInputElement;

    constructor(containerEl: HTMLElement) {
        this.containerEl = containerEl;
        this.inputEl = new JSDOM("<!DOCTYPE html>").window.document.createElement("input");
    }
}
