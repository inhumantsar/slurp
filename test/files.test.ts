jest.mock('obsidian', () => ({ normalizePath: (path: string) => path }));
jest.mock('../src/lib/logger', () => ({ logger: () => ({ debug: jest.fn() }) }));

import { getNewFilePath } from '../src/lib/files';

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
