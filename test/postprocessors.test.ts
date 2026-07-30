jest.mock('../src/frontmatter', () => ({ createFrontMatter: jest.fn() }));
jest.mock('../src/lib/images', () => ({
    getFirstImageDestination: jest.fn(),
    saveImagesLocally: jest.fn(),
}));

import type SlurpPlugin from '../main';
import { createFrontMatter } from '../src/frontmatter';
import { getFirstImageDestination, saveImagesLocally } from '../src/lib/images';
import { DEFAULT_POST_PROCESSORS, runPostProcessors } from '../src/postprocessors';
import type { IPostProcessor, IPostProcessorContext, ISettings } from '../src/types';

const settings = (saveLocally: boolean, setBanner: boolean): ISettings => ({
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

const makeContext = (saveLocally = false, setBanner = false): IPostProcessorContext => ({
    article: { title: 'Article', content: 'article body', link: 'https://example.com', slurpedTime: new Date(), tags: [] },
    filePath: 'Slurped Pages/Article.md',
    plugin: {
        app: { vault: {} },
        fmProps: new Map(),
        settings: settings(saveLocally, setBanner),
    } as unknown as SlurpPlugin,
});

describe('runPostProcessors', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        (createFrontMatter as jest.MockedFunction<typeof createFrontMatter>).mockReturnValue('title: Article');
    });

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

    it('registers frontmatter before the image processor and skips image saving while disabled', async () => {
        expect(DEFAULT_POST_PROCESSORS.map((processor) => processor.id)).toEqual([
            'create-frontmatter',
            'save-images-locally',
            'set-banner-frontmatter',
        ]);
        const context = makeContext(false);
        await expect(runPostProcessors('body', DEFAULT_POST_PROCESSORS, context))
            .resolves.toBe('---\ntitle: Article\n---\n\nbody');
        expect(createFrontMatter).toHaveBeenCalledWith(context.article, context.plugin.fmProps, false);
        expect(saveImagesLocally).not.toHaveBeenCalled();
        expect(getFirstImageDestination).not.toHaveBeenCalled();
    });

    it('passes earlier Markdown output rather than article.content to the image processor', async () => {
        const context = makeContext(true);
        (saveImagesLocally as jest.MockedFunction<typeof saveImagesLocally>).mockResolvedValue('localized');
        const prepend: IPostProcessor = { id: 'prepend', process: (markdown) => `new ${markdown}` };

        await expect(runPostProcessors('image', [prepend, ...DEFAULT_POST_PROCESSORS], context)).resolves.toBe('localized');
        expect(saveImagesLocally).toHaveBeenCalledWith('---\ntitle: Article\n---\n\nnew image', context);
        expect(saveImagesLocally).not.toHaveBeenCalledWith(context.article.content, expect.anything());
    });
    it('sets banner frontmatter from the first image after image processing', async () => {
        const context = makeContext(false, true);
        (getFirstImageDestination as jest.MockedFunction<typeof getFirstImageDestination>)
            .mockReturnValue('https://example.com/hero.jpg');

        await expect(runPostProcessors('![hero](https://example.com/hero.jpg)', DEFAULT_POST_PROCESSORS, context))
            .resolves.toBe(
                '---\ntitle: Article\nbanner: https://example.com/hero.jpg\n---\n\n![hero](https://example.com/hero.jpg)',
            );
        expect(getFirstImageDestination).toHaveBeenCalledWith(
            '---\ntitle: Article\n---\n\n![hero](https://example.com/hero.jpg)',
        );
    });

    it('leaves frontmatter unchanged when banner mode is enabled without an image', async () => {
        await expect(runPostProcessors('body', DEFAULT_POST_PROCESSORS, makeContext(false, true)))
            .resolves.toBe('---\ntitle: Article\n---\n\nbody');
    });

});
