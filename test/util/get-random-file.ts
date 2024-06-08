import type { TAbstractFile } from "obsidian";

export const getRandomFile = (arr: TAbstractFile[]) => {
    return arr[Math.floor(Math.random() * arr.length)];
};
