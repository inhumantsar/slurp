import { AbstractInputSuggest, TFolder, type App, type TAbstractFile } from "obsidian";
import { damerauLevenshtein } from "../../lib/damerau-levenshtein";

/**
 * Provides suggestions for file and folder paths.
 */
export class FileInputSuggest extends AbstractInputSuggest<TAbstractFile> {
    app: App;
    inputEl: HTMLDivElement | HTMLInputElement;
    // biome-ignore lint/suspicious/noExplicitAny: obsidian demands it
    callback: (value: TAbstractFile, evt: MouseEvent | KeyboardEvent) => any = () => { };
    filter: "file" | "folder" | "both" = "both";

    /**
     * Creates a new instance of the FileInputSuggest class.
     * @param app - The application instance. Required to list files/folders in the Vault.
     * @param textInputEl - An input or editable div.
     */
    constructor(app: App, textInputEl: HTMLDivElement | HTMLInputElement) {
        super(app, textInputEl);
        this.inputEl = textInputEl;
        this.app = app;
    }

    /**
     * Calculates the similarity score between a query and a path.
     * The score is based on the Damerau-Levenshtein distance between the query and path,
     * with a multiplier that favors partial substring matches and prefix matches.
     *
     * @param query - The query string.
     * @param path - The path string.
     * @returns The similarity score between the query and path.
     */
    static similarityScore(query: string, path: string): number {
        // augment the edit distance with a multiplier which favours partial substring matches
        const q = query.toLowerCase();
        const p = path.toLowerCase();

        return damerauLevenshtein(q, p) * (p.includes(q) ? 0.2 : 1) * (p.startsWith(q) ? 0.1 : 1);
    };

    /**
     * Recurses through the entire directory tree to get the complete list of folders.
     * @param folder - The folder to start the recursion from. If not provided, the root folder of the app's vault is used.
     * @returns A flat array of folder objects.
     */
    getFolders(folder?: TFolder): TFolder[] {
        const f = (folder || this.app.vault.getRoot());
        const filteredChildren = f.children
            .filter((val): val is TFolder => val instanceof TFolder);
        const childFolders = filteredChildren
            .map((folder) => this.getFolders(folder));
        const flatChildFolders = childFolders.flat();
        return [f, ...flatChildFolders];
    }

    /**
     * Retrieves the suggestions for the given query.
     * @param query - The query string.
     * @returns An array of file or folder objects which match the query.
     */
    protected getSuggestions(query: string): TAbstractFile[] {
        const files = [
            ...this.filter !== "file" ? this.getFolders() : [],
            ...this.filter !== "folder" ? this.app.vault.getFiles() : []
        ];
        files.sort((a, b) => FileInputSuggest.similarityScore(query, a.name) - FileInputSuggest.similarityScore(query, b.name));
        return files;
    }

    /**
     * Adds the suggestion for the given file to the popover.
     * @param file - The file or folder to render.
     * @param el - The HTML element to render the suggestion in.
     */
    renderSuggestion(file: TAbstractFile, el: HTMLElement) {
        el.appendText(file.path);
    }

    /**
     * Fired when the user selects a given suggestion and performs the necessary actions.
     * @param file - The file or folder that was selected.
     * @param evt - The event that triggered the selection.
     */
    async selectSuggestion(file: TAbstractFile, evt: MouseEvent | KeyboardEvent) {
        super.setValue(file.path);
        this.callback(file, evt);
        this.close();
    }
}
