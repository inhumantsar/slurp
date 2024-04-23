import { TFile, App, TFolder, AbstractInputSuggest, AbstractTextComponent, TextComponent, TAbstractFile } from "obsidian";

export class FileInputSuggest extends AbstractInputSuggest<TAbstractFile> {
    app: App;
    inputEl: HTMLDivElement | HTMLInputElement;
    callback: (value: TAbstractFile, evt: MouseEvent | KeyboardEvent) => any = () => { };
    filter: "file" | "folder" | "both" = "both";

    constructor(app: App, textInputEl: HTMLDivElement | HTMLInputElement) {
        super(app, textInputEl);
        this.inputEl = textInputEl;
        this.app = app;
    }

    getFolders(folder?: TFolder): TFolder[] {
        const f = (folder || this.app.vault.getRoot());
        const filteredChildren = f.children
            .filter((val): val is TFolder => val instanceof TFolder);
        const childFolders = filteredChildren
            .map((folder) => this.getFolders(folder));
        const flatChildFolders = childFolders.flat();
        return [f, ...flatChildFolders];
    }

    protected getSuggestions(query: string): TAbstractFile[] {
        const files = [
            ...this.filter != "file" ? this.getFolders() : [],
            ...this.filter != "folder" ? this.app.vault.getFiles() : []
        ];
        files.sort((a, b) => similarityScore(query, a.name) - similarityScore(query, b.name));
        return files;
    }

    renderSuggestion(file: TAbstractFile, el: HTMLElement) {
        el.appendText(file.path);
    }

    async selectSuggestion(file: TAbstractFile, evt: MouseEvent | KeyboardEvent) {
        super.setValue(file.path);
        this.callback(file, evt);
        this.close()
    }
}

export class FileInputSuggestComponent extends TextComponent {
    fileInputSuggest: FileInputSuggest;

    constructor(containerEl: HTMLElement, app: App) {
        super(containerEl);
        containerEl.appendChild(this.inputEl);
        this.fileInputSuggest = new FileInputSuggest(app, this.inputEl);
    }

    onSelect(cb: (value: TAbstractFile, evt: MouseEvent | KeyboardEvent) => any): this {
        this.fileInputSuggest.onSelect(cb);
        this.fileInputSuggest.callback = cb;
        return this;
    }

    addFilter(filter: "file" | "folder" | "both" = "both"): this {
        this.fileInputSuggest.filter = filter;
        return this;
    }

    addLimit(limit: number = 100): this {
        this.fileInputSuggest.limit = limit;
        return this;
    }
}


const similarityScore = (query: string, path: string): number => {
    // augment the edit distance with a multiplier which favours partial substring matches
    const q = query.toLowerCase();
    const p = path.toLowerCase();

    return damerauLevenshtein(q, p) * (p.includes(q) ? 0.2 : 1) * (p.startsWith(q) ? 0.1 : 1);
}

const damerauLevenshtein = (strA: string, strB: string): number => {
    // this is an implementation of the Damerau-Levenshtein (aka optimal string alignment) 
    // Distance algorithm for string similarity. it takes two strings and calculates the minimum 
    // number of edits it would take for one to match the other. it's not the most useful
    // for this kind of fuzzy matching, but it works.
    //
    // could i have used a library with a better algo instead of implementing this myself? 
    // of course! but this was more fun :)  

    // the strings are mapped to mapped to matrix locations 1..n, so to make things
    // easier to reason about, we can create new arrays which start with null
    const a = [null, ...Array.from(strA.toLowerCase())];
    const b = [null, ...Array.from(strB.toLowerCase())];

    // init a matrix the size of a and b to hold the edit distances
    const d = new Array(a.length).fill(null).map(() => Array(b.length).fill(Infinity));

    // the first row and column represent distances between the ith character
    // of each word and its first letter.
    //     t o o t h r e e  
    //   0 1 2 3 4 5 6 7 8
    // m 1
    // o 2
    // 0 3
    for (let i = 0; i < a.length; i++) {
        d[i][0] = i;
    }
    for (let i = 0; i < b.length; i++) {
        d[0][i] = i;
    }

    for (let i = 1; i < a.length; i++) {
        for (let j = 1; j < b.length; j++) {
            // set the base cost to 0 when the letters are the same
            let cost = a[i] === b[j] ? 0 : 1

            d[i][j] = Math.min(d[i - 1][j] + 1, // deletion
                d[i][j - 1] + 1,                // insertion
                d[i - 1][j - 1] + cost)         // substitution

            //
            if (i > 1 && j > 1 && a[i - 1] == b[j] && a[i] == b[j - 1])
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)  // transposition
        }
    }

    //     t o o t h r e e 
    //   0 1 2 3 4 5 6 7 8
    // m 1 1 2 3 4 5 6 7 8
    // o 2 2 1 2 3 4 5 6 7
    // o 3 3 2 1 2 3 4 5 6 <-- d
    // 
    // the result, d = 6, means it would take at least 6 edits to get from "moo" to "toothree" 
    // or vice versa: substitute "m" for "t" plus append x5 (t-h-r-e-e)
    return d[a.length - 1][b.length - 1]
}
