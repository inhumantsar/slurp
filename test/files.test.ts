jest.mock('obsidian', () => ({ normalizePath: (path: string) => path }));
jest.mock('../src/lib/logger', () => ({ logger: () => ({ debug: jest.fn() }) }));

import { ensureFolderExists, getNewFilePath } from '../src/lib/files';

describe('getNewFilePath', () => {
    it('throws an Error without changing the duplicate-limit message', async () => {
        const vault = {
            getFolderByPath: jest.fn(() => ({ path: '' })),
            getFileByPath: jest.fn(() => ({})),
        };

        await expect(getNewFilePath(vault as never, 'Duplicate', ''))
            .rejects.toThrow(new Error('Cowardly refusing to increment past 100.'));
    });
});

describe('ensureFolderExists', () => {
    it('creates nested missing segments parent-first', async () => {
        const folders = new Set(['']);
        const vault = {
            getFolderByPath: jest.fn((path: string) => folders.has(path) ? { path } : null),
            createFolder: jest.fn(async (path: string) => {
                folders.add(path);
                return { path };
            }),
        };

        await expect(ensureFolderExists(vault as never, 'one/two/three')).resolves.toBe('one/two/three');
        expect(vault.createFolder.mock.calls.map(([path]) => path)).toEqual(['one', 'one/two', 'one/two/three']);
    });

    it('retains existing and root paths without creating folders', async () => {
        const vault = {
            getFolderByPath: jest.fn((path: string) => path === 'existing' ? { path } : null),
            createFolder: jest.fn(),
        };

        await expect(ensureFolderExists(vault as never, '')).resolves.toBe('');
        await expect(ensureFolderExists(vault as never, 'existing')).resolves.toBe('existing');
        expect(vault.createFolder).not.toHaveBeenCalled();
    });

    it('accepts a create race only when the folder exists after rejection', async () => {
        const folders = new Set<string>();
        const vault = {
            getFolderByPath: jest.fn((path: string) => folders.has(path) ? { path } : null),
            createFolder: jest.fn(async (path: string) => {
                folders.add(path);
                throw new Error('created concurrently');
            }),
        };

        await expect(ensureFolderExists(vault as never, 'raced')).resolves.toBe('raced');
    });

    it('propagates a folder creation failure when the path is still absent', async () => {
        const vault = {
            getFolderByPath: jest.fn(() => null),
            createFolder: jest.fn(async () => { throw new Error('disk failure'); }),
        };

        await expect(ensureFolderExists(vault as never, 'missing')).rejects.toThrow('disk failure');
    });
});
