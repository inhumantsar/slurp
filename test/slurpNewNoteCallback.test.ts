jest.mock('obsidian', () => ({
    MarkdownView: class {},
    Menu: class {},
    MenuItem: class {},
    Notice: class {},
    Plugin: class {},
    normalizePath: (path: string) => path.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, ''),
    requestUrl: jest.fn(),
}));
jest.mock('../src/const', () => ({
    DEFAULT_SETTINGS: {
        settingsVersion: 1,
        defaultPath: 'Slurped Pages',
        frontmatterOnly: false,
        images: { saveLocally: false, folder: '_files', setBanner: false },
        fm: { includeEmpty: false, tags: { parse: true, prefix: '', case: 'iKebab-case' }, properties: {} },
        logs: { debug: false, logPath: '_logs' },
    },
}));
jest.mock('../src/frontmatter', () => ({
    createFrontMatter: jest.fn(),
    createFrontMatterPropSettings: jest.fn(),
    createFrontMatterProps: jest.fn(),
}));
jest.mock('../src/lib/files', () => ({
    ...jest.requireActual('../src/lib/files'),
    getNewFilePath: jest.fn(),
}));
jest.mock('../src/lib/logger', () => ({
    Logger: class {},
    logger: () => ({ debug: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));
jest.mock('../src/modals/new-note', () => ({ SlurpNewNoteModal: class {} }));
jest.mock('../src/pipeline', () => ({ slurpPipeline: jest.fn() }));
jest.mock('../src/processors', () => ({ DEFAULT_SLURP_PROCESSORS: { document: [], article: [], markdown: [] } }));
jest.mock('../src/settings', () => ({ SlurpSettingsTab: class {} }));
jest.mock('../main.js', () => jest.requireActual('../main.ts'));

import { requestUrl } from 'obsidian';

import SlurpPlugin from '../main';
import { createFrontMatter } from '../src/frontmatter';
import { getNewFilePath } from '../src/lib/files';
import * as postprocessors from '../src/postprocessors';
import type { IArticle, ISettings } from '../src/types';

interface IMemoryFile { path: string; }

const ARTICLE: IArticle = {
    title: 'Article',
    content: '![hero](https://example.com/mootoothree.jpg)',
    link: 'https://example.com/posts/one',
    slurpedTime: new Date(),
    tags: [],
};

const settings = (saveLocally: boolean, setBanner = false): ISettings => ({
    settingsVersion: 1,
    defaultPath: 'Slurped Pages',
    frontmatterOnly: false,
    images: { saveLocally, folder: '_files', setBanner },
    fm: {
        includeEmpty: false,
        tags: { parse: true, prefix: '', case: 'iKebab-case' },
        properties: {},
    },
    logs: { debug: false, logPath: '_logs' },
});

const makeVault = () => {
    const folders = new Set(['', 'Slurped Pages']);
    const binaries = new Map<string, ArrayBuffer>();
    const notes = new Map<string, string>();
    return {
        folders,
        binaries,
        notes,
        getFolderByPath: jest.fn((path: string) => folders.has(path) ? { path } : null),
        createFolder: jest.fn(async (path: string) => {
            folders.add(path);
            return { path };
        }),
        getFileByPath: jest.fn((path: string): IMemoryFile | null => binaries.has(path) ? { path } : null),
        readBinary: jest.fn(async (file: IMemoryFile) => binaries.get(file.path)!),
        createBinary: jest.fn(async (path: string, bytes: ArrayBuffer) => {
            binaries.set(path, bytes.slice(0));
            return { path };
        }),
        create: jest.fn(async (path: string, content: string) => {
            notes.set(path, content);
            return { path };
        }),
    };
};

const makePlugin = (saveLocally: boolean, setBanner = false) => {
    const vault = makeVault();
    const openFile = jest.fn();
    const plugin = Object.create(SlurpPlugin.prototype) as SlurpPlugin;
    Object.assign(plugin, {
        app: {
            vault,
            workspace: { getActiveViewOfType: jest.fn(() => ({ leaf: { openFile } })) },
        },
        settings: settings(saveLocally, setBanner),
        fmProps: new Map(),
        logger: { debug: jest.fn(), warn: jest.fn(), error: jest.fn() },
    });
    return { plugin, vault, openFile };
};

const requestUrlMock = requestUrl as jest.MockedFunction<typeof requestUrl>;
const getNewFilePathMock = getNewFilePath as jest.MockedFunction<typeof getNewFilePath>;
const createFrontMatterMock = createFrontMatter as jest.MockedFunction<typeof createFrontMatter>;

beforeEach(() => {
    jest.clearAllMocks();
    getNewFilePathMock.mockResolvedValue('Slurped Pages/Article.md');
    createFrontMatterMock.mockReturnValue('title: Article');
});

describe('SlurpPlugin.slurpNewNoteCallback', () => {
    it('writes the complete post-processor result', async () => {
        const { plugin, vault } = makePlugin(false);
        const runner = jest.spyOn(postprocessors, 'runPostProcessors').mockResolvedValue('processed note');

        await plugin.slurpNewNoteCallback(ARTICLE);

        expect(runner).toHaveBeenCalledWith(ARTICLE.content, postprocessors.DEFAULT_POST_PROCESSORS, {
            article: ARTICLE,
            filePath: 'Slurped Pages/Article.md',
            plugin,
        });
        expect(createFrontMatterMock).not.toHaveBeenCalled();
        expect(vault.create).toHaveBeenCalledWith('Slurped Pages/Article.md', 'processed note');
        runner.mockRestore();
    });

    it('sets the banner to the localized first image before writing the note', async () => {
        const { plugin, vault } = makePlugin(true, true);
        const imageBytes = new Uint8Array([1, 2, 3]).buffer;
        requestUrlMock.mockResolvedValue({
            status: 200,
            headers: { 'content-type': 'image/jpeg' },
            arrayBuffer: imageBytes,
        } as never);

        await plugin.slurpNewNoteCallback(ARTICLE);

        const binaryPath = 'Slurped Pages/_files/ae4b222a_mootoothree.jpg';
        expect(vault.createBinary).toHaveBeenCalledWith(binaryPath, imageBytes);
        expect(vault.create).toHaveBeenCalledWith(
            'Slurped Pages/Article.md',
            '---\ntitle: Article\nbanner: _files/ae4b222a_mootoothree.jpg\n---\n\n![hero](_files/ae4b222a_mootoothree.jpg)',
        );
        expect(vault.createBinary.mock.invocationCallOrder[0]).toBeLessThan(vault.create.mock.invocationCallOrder[0]);
    });
});
