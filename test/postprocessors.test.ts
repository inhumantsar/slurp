jest.mock('../src/lib/images', () => ({ saveImagesLocally: jest.fn() }));

import { saveImagesLocally } from '../src/lib/images';
import { DEFAULT_POST_PROCESSORS, runPostProcessors } from '../src/postprocessors';
import type { IPostProcessor, IPostProcessorContext, ISettings } from '../src/types';

const settings = (saveLocally: boolean): ISettings => ({
    settingsVersion: 1,
    defaultPath: 'Slurped Pages',
    frontmatterOnly: false,
    images: { saveLocally, folder: '_files' },
    fm: {
        includeEmpty: false,
        tags: { parse: true, prefix: '', case: 'iKebab-case' },
        properties: {},
    },
    logs: { debug: false, logPath: '_logs' },
});

const makeContext = (saveLocally = false): IPostProcessorContext => ({
    article: { title: 'Article', content: 'article body', link: 'https://example.com', slurpedTime: new Date(), tags: [] },
    filePath: 'Slurped Pages/Article.md',
    settings: settings(saveLocally),
    vault: {} as never,
});

describe('runPostProcessors', () => {
    beforeEach(() => jest.clearAllMocks());

    it('runs processors in declaration order and passes each output to the next', async () => {
        const processors: IPostProcessor[] = [
            { id: 'sync', process: (markdown) => markdown + 'a' },
            { id: 'async', process: async (markdown) => markdown + 'b' },
        ];

        await expect(runPostProcessors('', processors, makeContext())).resolves.toBe('ab');
    });

    it('passes the identical context object to every processor', async () => {
        const context = makeContext();
        const first = jest.fn((markdown: string) => markdown);
        const second = jest.fn((markdown: string) => markdown);

        await runPostProcessors('body', [
            { id: 'first', process: first },
            { id: 'second', process: second },
        ], context);

        expect(first).toHaveBeenCalledWith('body', context);
        expect(second).toHaveBeenCalledWith('body', context);
    });

    it('propagates a rejection without running later processors', async () => {
        const later = jest.fn((markdown: string) => markdown);
        const failure: IPostProcessor = {
            id: 'failure',
            process: () => { throw new Error('post-processing failed'); },
        };

        await expect(runPostProcessors('body', [failure, { id: 'later', process: later }], makeContext()))
            .rejects.toThrow('post-processing failed');
        expect(later).not.toHaveBeenCalled();
    });

    it('registers the image processor under its stable ID and is a no-op while disabled', async () => {
        expect(DEFAULT_POST_PROCESSORS.map((processor) => processor.id)).toEqual(['save-images-locally']);
        await expect(runPostProcessors('body', DEFAULT_POST_PROCESSORS, makeContext(false))).resolves.toBe('body');
        expect(saveImagesLocally).not.toHaveBeenCalled();
    });

    it('passes earlier Markdown output rather than article.content to the image processor', async () => {
        const context = makeContext(true);
        (saveImagesLocally as jest.MockedFunction<typeof saveImagesLocally>).mockResolvedValue('localized');
        const prepend: IPostProcessor = { id: 'prepend', process: (markdown) => `new ${markdown}` };

        await expect(runPostProcessors('image', [prepend, ...DEFAULT_POST_PROCESSORS], context)).resolves.toBe('localized');
        expect(saveImagesLocally).toHaveBeenCalledWith('new image', context);
        expect(saveImagesLocally).not.toHaveBeenCalledWith(context.article.content, expect.anything());
    });
});
