jest.mock('obsidian', () => ({
    normalizePath: (path: string) => path
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/')
        .replace(/^\.\//, '')
        .replace(/\/$/, ''),
    requestUrl: jest.fn(),
}));
jest.mock('../src/lib/logger', () => ({
    logger: () => ({ debug: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}));

import { requestUrl, type RequestUrlParam } from 'obsidian';

import type SlurpPlugin from '../main';
import { getFirstImageDestination, saveImagesLocally } from '../src/lib/images';
import { murmurhash3_32 } from '../src/lib/util';
import type { IPostProcessorContext, ISettings } from '../src/types';

interface IMemoryFile { path: string; }

const ARTICLE_URL = 'https://example.com/posts/one';
const ARTICLE_HASH = 'ae4b222a';
const NOTE_PATH = 'Slurped Pages/Article.md';
const IMAGE_BYTES = new Uint8Array([1, 2, 3]).buffer;

const response = (status = 200, bytes = IMAGE_BYTES, contentType = 'image/jpeg') => ({
    status,
    headers: { 'Content-Type': contentType },
    arrayBuffer: bytes,
});

const makeVault = () => {
    const folders = new Set(['', 'Slurped Pages']);
    const files = new Map<string, ArrayBuffer>();
    const vault = {
        folders,
        files,
        getFolderByPath: jest.fn((path: string) => folders.has(path) ? { path } : null),
        createFolder: jest.fn(async (path: string) => {
            const slash = path.lastIndexOf('/');
            const parent = slash === -1 ? '' : path.slice(0, slash);
            if (!folders.has(parent)) throw new Error(`Missing parent ${parent}`);
            if (folders.has(path)) throw new Error(`Folder exists ${path}`);
            folders.add(path);
            return { path };
        }),
        getFileByPath: jest.fn((path: string): IMemoryFile | null => files.has(path) ? { path } : null),
        createBinary: jest.fn(async (path: string, bytes: ArrayBuffer) => {
            const slash = path.lastIndexOf('/');
            const parent = slash === -1 ? '' : path.slice(0, slash);
            if (!folders.has(parent)) throw new Error(`Missing folder ${parent}`);
            if (files.has(path)) throw new Error(`File exists ${path}`);
            files.set(path, bytes.slice(0));
            return { path };
        }),
        readBinary: jest.fn(async (file: IMemoryFile) => {
            const bytes = files.get(file.path);
            if (bytes === undefined) throw new Error(`Missing file ${file.path}`);
            return bytes.slice(0);
        }),
    };
    return vault;
};

const makeSettings = (folder = '_files'): ISettings => ({
    settingsVersion: 1,
    defaultPath: 'Slurped Pages',
    frontmatterOnly: false,
    images: { saveLocally: true, folder, setBanner: false },
    fm: {
        includeEmpty: false,
        tags: { parse: true, prefix: '', case: 'iKebab-case' },
        properties: {},
    },
    logs: { debug: false, logPath: '_logs' },
});

const makeContext = (
    vault: ReturnType<typeof makeVault>,
    folder = '_files',
    articleLink: string | null = ARTICLE_URL,
): IPostProcessorContext => ({
    article: { title: 'Article', content: 'original', link: articleLink ?? undefined, slurpedTime: new Date(), tags: [] },
    filePath: NOTE_PATH,
    plugin: {
        app: { vault },
        settings: makeSettings(folder),
    } as unknown as SlurpPlugin,
});

const requestUrlMock = requestUrl as jest.MockedFunction<typeof requestUrl>;
// Obsidian types requestUrl as a Promise subclass; Jest supplies an ordinary resolved promise in this unit test.
const flexibleRequestUrlMock: jest.Mock = requestUrlMock as never;
const requestedUrl = (request: string | RequestUrlParam): string =>
    typeof request === 'string' ? request : request.url;

beforeEach(() => {
    jest.clearAllMocks();
    requestUrlMock.mockResolvedValue(response() as never);
});

describe('getFirstImageDestination', () => {
    it('returns the first parsed image destination', () => {
        const markdown = [
            '![first](https://example.com/first.jpg)',
            '![second](https://example.com/second.jpg)',
        ].join('\n');

        expect(getFirstImageDestination(markdown)).toBe('https://example.com/first.jpg');
    });

    it('ignores image syntax in frontmatter', () => {
        const markdown = [
            '---',
            'excerpt: "![not-content](https://example.com/frontmatter.jpg)"',
            '---',
            '![first](https://example.com/first.jpg)',
        ].join('\n');

        expect(getFirstImageDestination(markdown)).toBe('https://example.com/first.jpg');
    });
});

describe('saveImagesLocally', () => {
    it('downloads an image beside the note and rewrites its destination', async () => {
        const vault = makeVault();

        const result = await saveImagesLocally(
            '![hero](https://example.com/img/mootoothree.jpg)',
            makeContext(vault),
        );

        const target = 'Slurped Pages/_files/ae4b222a_mootoothree.jpg';
        expect(result).toBe('![hero](_files/ae4b222a_mootoothree.jpg)');
        expect(vault.files.has(target)).toBe(true);
        expect(vault.createBinary).toHaveBeenCalledWith(target, IMAGE_BYTES);
    });

    it('resolves relative, angle, balanced-parenthesis, and titled destinations while preserving syntax', async () => {
        const vault = makeVault();
        const markdown = [
            '![relative](../img/a.png "title")',
            "![angle](<https://cdn.example.com/a%20b.png> 'caption')",
            '![balanced](https://cdn.example.com/a(b).png (caption))',
        ].join('\n');

        const result = await saveImagesLocally(markdown, makeContext(vault));

        expect(result).toBe([
            '![relative](_files/ae4b222a_a.png "title")',
            "![angle](<_files/ae4b222a_a%20b.png> 'caption')",
            '![balanced](_files/ae4b222a_a%28b%29.png (caption))',
        ].join('\n'));
        expect(requestUrlMock.mock.calls.map(([options]) => requestedUrl(options))).toEqual([
            'https://example.com/img/a.png',
            'https://cdn.example.com/a%20b.png',
            'https://cdn.example.com/a(b).png',
        ]);
    });

    it('leaves non-rendered image syntax untouched without creating a folder', async () => {
        const vault = makeVault();
        const markdown = [
            '![]() ![fragment](#part) \\![escaped](https://example.com/escaped.jpg)',
            '`![inline](https://example.com/inline.jpg)`',
            '~~~',
            '![fenced](https://example.com/fenced.jpg)',
            '~~~',
            '[link](https://example.com/link.jpg)',
            '<img src="https://example.com/html.jpg">',
            '![reference][image]',
            '[image]: https://example.com/reference.jpg',
        ].join('\n');

        await expect(saveImagesLocally(markdown, makeContext(vault))).resolves.toBe(markdown);
        expect(requestUrlMock).not.toHaveBeenCalled();
        expect(vault.createFolder).not.toHaveBeenCalled();
    });

    it('retains query parameters for requests, drops fragments, and deduplicates variants', async () => {
        const vault = makeVault();
        const url = 'https://cdn.example.com/photo.jpg?width=640';
        const markdown = `![one](${url}#one) ![two](${url}#two) ![three](${url})`;

        const result = await saveImagesLocally(markdown, makeContext(vault));

        expect(requestUrlMock).toHaveBeenCalledTimes(1);
        expect(requestUrlMock).toHaveBeenCalledWith({ url, method: 'GET', throw: false });
        expect(vault.createBinary).toHaveBeenCalledTimes(1);
        expect(result).toBe([
            '![one](_files/ae4b222a_photo.jpg)',
            '![two](_files/ae4b222a_photo.jpg)',
            '![three](_files/ae4b222a_photo.jpg)',
        ].join(' '));
    });

    it('gives distinct same-basename URLs deterministic paths even when bytes match', async () => {
        const vault = makeVault();
        const first = 'https://one.example/image.jpg';
        const second = 'https://two.example/image.jpg';
        const secondHash = murmurhash3_32(second).toString(16).padStart(8, '0');

        const result = await saveImagesLocally(`![one](${first}) ![two](${second})`, makeContext(vault));

        expect(result).toBe(
            `![one](_files/${ARTICLE_HASH}_image.jpg) `
            + `![two](_files/${ARTICLE_HASH}_${secondHash}_image.jpg)`,
        );
        expect(vault.createBinary).toHaveBeenCalledTimes(2);
    });

    it('reuses identical existing data and leaves different existing data untouched', async () => {
        const vault = makeVault();
        vault.folders.add('Slurped Pages/_files');
        const firstCandidate = `Slurped Pages/_files/${ARTICLE_HASH}_photo.jpg`;
        vault.files.set(firstCandidate, new Uint8Array([9]).buffer);
        const url = 'https://cdn.example.com/photo.jpg';
        const imageHash = murmurhash3_32(url).toString(16).padStart(8, '0');

        const result = await saveImagesLocally(`![photo](${url})`, makeContext(vault));

        expect(Array.from(new Uint8Array(vault.files.get(firstCandidate)!))).toEqual([9]);
        expect(result).toBe(`![photo](_files/${ARTICLE_HASH}_${imageHash}_photo.jpg)`);
        expect(vault.createBinary).toHaveBeenCalledWith(
            `Slurped Pages/_files/${ARTICLE_HASH}_${imageHash}_photo.jpg`,
            IMAGE_BYTES,
        );

        const secondVault = makeVault();
        secondVault.folders.add('Slurped Pages/_files');
        secondVault.files.set(firstCandidate, IMAGE_BYTES);
        await saveImagesLocally(`![photo](${url})`, makeContext(secondVault));
        expect(secondVault.createBinary).not.toHaveBeenCalled();
    });

    it('uses a MIME extension after a malformed pathname escape falls back to image', async () => {
        const vault = makeVault();
        requestUrlMock.mockResolvedValue(response(200, IMAGE_BYTES, 'IMAGE/PNG; charset=binary') as never);

        const result = await saveImagesLocally(
            '![bad](https://cdn.example.com/%E0%A4%A)',
            makeContext(vault),
        );

        expect(result).toBe(`![bad](_files/${ARTICLE_HASH}_image.png)`);
    });

    it('encodes every Markdown path segment including punctuation encodeURIComponent leaves behind', async () => {
        const vault = makeVault();
        const result = await saveImagesLocally(
            "![special](https://cdn.example.com/it's%20(x).png)",
            makeContext(vault, 'assets & files'),
        );

        expect(result).toBe(`![special](assets%20%26%20files/${ARTICLE_HASH}_it%27s%20%28x%29.png)`);
    });

    it('uses the note directory when the image folder setting is blank', async () => {
        const vault = makeVault();

        const result = await saveImagesLocally(
            '![hero](https://example.com/hero.jpg)',
            makeContext(vault, ''),
        );

        expect(result).toBe(`![hero](${ARTICLE_HASH}_hero.jpg)`);
        expect(vault.createFolder).not.toHaveBeenCalled();
        expect(vault.files.has(`Slurped Pages/${ARTICLE_HASH}_hero.jpg`)).toBe(true);
    });

    it('rejects a parent traversal before creating a folder or issuing a request', async () => {
        const vault = makeVault();
        const markdown = '![hero](https://example.com/hero.jpg)';

        await expect(saveImagesLocally(markdown, makeContext(vault, '../outside'))).resolves.toBe(markdown);
        expect(requestUrlMock).not.toHaveBeenCalled();
        expect(vault.createFolder).not.toHaveBeenCalled();
    });

    it('keeps failed destinations remote and continues localizing later images', async () => {
        const vault = makeVault();
        flexibleRequestUrlMock.mockImplementation((request: string | RequestUrlParam) => Promise.resolve(
            requestedUrl(request).includes('failed') ? response(503, new ArrayBuffer(0)) : response(),
        ));
        const markdown = [
            '![failed](https://example.com/failed.jpg)',
            '![success](https://example.com/success.jpg)',
        ].join(' ');

        const result = await saveImagesLocally(markdown, makeContext(vault));

        expect(result).toBe(
            '![failed](https://example.com/failed.jpg) '
            + `![success](_files/${ARTICLE_HASH}_success.jpg)`,
        );
        expect(requestUrlMock).toHaveBeenCalledTimes(2);
        expect(vault.createBinary).toHaveBeenCalledTimes(1);
    });

    it('returns unchanged Markdown when the article link or image folder is unavailable', async () => {
        const markdown = '![hero](https://example.com/hero.jpg)';
        const noLinkVault = makeVault();
        await expect(saveImagesLocally(markdown, makeContext(noLinkVault, '_files', null))).resolves.toBe(markdown);

        const folderFailureVault = makeVault();
        folderFailureVault.createFolder.mockRejectedValue(new Error('disk unavailable'));
        await expect(saveImagesLocally(markdown, makeContext(folderFailureVault))).resolves.toBe(markdown);
        expect(requestUrlMock).not.toHaveBeenCalled();
    });
});
