import type { IArticle, ISlurpProcessor, ISlurpProcessorContext } from '../src/types';
import { runSlurpProcessors, DEFAULT_SLURP_PROCESSORS } from '../src/processors';
import { slurpPipeline } from '../src/pipeline';
import * as parse from '../src/parse';

jest.mock('../src/parse');

const FAKE_DOC = { documentElement: {} } as unknown as Document;
const SENTINEL_DOC = { documentElement: { tagName: 'sentinel' } } as unknown as Document;

const FAKE_ARTICLE: Partial<IArticle> = {
	title: 'Test Article',
	content: '<p>Test content</p>',
	textContent: 'Test content',
};

const FAKE_METADATA = { slurpedTime: new Date(), tags: [] };

const DEFAULT_TAG_SETTINGS = { parse: true, prefix: '', case: 'kebab-case' as const };

beforeEach(() => {
	jest.clearAllMocks();
	(parse.fetchHtml as jest.Mock).mockResolvedValue('<html></html>');
	(parse.parseHtml as jest.Mock).mockReturnValue(FAKE_DOC);
	(parse.parsePage as jest.Mock).mockReturnValue(FAKE_ARTICLE);
	(parse.parseMetadata as jest.Mock).mockReturnValue(FAKE_METADATA);
	(parse.mergeMetadata as jest.Mock).mockImplementation(
		(article: IArticle, metadata: IArticle) => ({ ...article, ...metadata })
	);
	(parse.parseMarkdown as jest.Mock).mockReturnValue('converted');
	(parse.convertMathDelimiters as jest.Mock).mockImplementation(
		(markdown: string) => markdown
	);
});

describe('runSlurpProcessors', () => {
	it('runs processors in declaration order, passing output to next', async () => {
		const processor1: ISlurpProcessor<string> = {
			id: 'sync-append',
			process: (value: string) => value + 'a',
		};
		const processor2: ISlurpProcessor<string> = {
			id: 'async-append',
			process: async (value: string) => value + 'b',
		};

		const result = await runSlurpProcessors(
			'',
			[processor1, processor2],
			{ url: 'https://example.com' },
		);

		expect(result).toBe('ab');
	});

	it('passes the same context to each processor', async () => {
		const context: ISlurpProcessorContext = { url: 'https://example.com' };
		const spy1 = jest.fn((value: string, _ctx: ISlurpProcessorContext) => value);
		const spy2 = jest.fn((value: string, _ctx: ISlurpProcessorContext) => value);

		await runSlurpProcessors('test', [
			{ id: 'ctx-1', process: spy1 },
			{ id: 'ctx-2', process: spy2 },
		], context);

		expect(spy1).toHaveBeenCalledWith('test', context);
		expect(spy2).toHaveBeenCalledWith('test', context);
	});

	it('propagates a processor rejection and skips later processors', async () => {
		const spyLater = jest.fn((value: string) => value);
		const errorProcessor: ISlurpProcessor<string> = {
			id: 'error',
			process: () => { throw new Error('processor failed'); },
		};

		await expect(
			runSlurpProcessors('', [errorProcessor, { id: 'later', process: spyLater }], { url: 'https://example.com' })
		).rejects.toThrow('processor failed');

		expect(spyLater).not.toHaveBeenCalled();
	});
});

describe('slurpPipeline with processors', () => {
	it('document processor replaces the document seen by parsePage and parseMetadata', async () => {
		await slurpPipeline('https://example.com', {
			fmProps: new Map(),
			tagSettings: DEFAULT_TAG_SETTINGS,
			frontmatterOnly: true,
			processors: {
				document: [{ id: 'doc-marker', process: () => SENTINEL_DOC }],
				article: [],
				markdown: [],
			},
		});

		expect(parse.parsePage).toHaveBeenCalledWith(SENTINEL_DOC);
		expect(parse.parseMetadata).toHaveBeenCalledWith(
			SENTINEL_DOC, expect.anything(), expect.anything(), expect.anything(),
		);
	});

	it('article processor replaces HTML content and retains metadata fields', async () => {
		const result = await slurpPipeline('https://example.com', {
			fmProps: new Map(),
			tagSettings: DEFAULT_TAG_SETTINGS,
			frontmatterOnly: false,
			processors: {
				document: [],
				article: [{
					id: 'article-transform',
					process: (article: IArticle) => ({
						...article,
						content: '<p>Replaced</p>',
						extraField: 'extra-value',
					}),
				}],
				markdown: [],
			},
		});

		expect(parse.parseMarkdown).toHaveBeenCalledWith('<p>Replaced</p>');
		expect(result).toHaveProperty('extraField', 'extra-value');
	});

	it('markdown processor transforms the parseMarkdown output', async () => {
		const result = await slurpPipeline('https://example.com', {
			fmProps: new Map(),
			tagSettings: DEFAULT_TAG_SETTINGS,
			frontmatterOnly: false,
			processors: {
				document: [],
				article: [],
				markdown: [{
					id: 'md-transform',
					process: (md: string) => 'post-' + md,
				}],
			},
		});

		expect(result.content).toBe('post-converted');
	});

	it('frontmatterOnly mode runs article processor but skips parseMarkdown and markdown processor', async () => {
		const articleSpy = jest.fn((article: IArticle) => article);
		const markdownSpy = jest.fn((md: string) => md);

		const result = await slurpPipeline('https://example.com', {
			fmProps: new Map(),
			tagSettings: DEFAULT_TAG_SETTINGS,
			frontmatterOnly: true,
			processors: {
				document: [],
				article: [{ id: 'article-spy', process: articleSpy }],
				markdown: [{ id: 'md-spy', process: markdownSpy }],
			},
		});

		expect(articleSpy).toHaveBeenCalled();
		expect(parse.parseMarkdown).not.toHaveBeenCalled();
		expect(markdownSpy).not.toHaveBeenCalled();
		expect(result.content).toBe('');
	});

	it('frontmatterOnly mode preserves article processor additions', async () => {
		const result = await slurpPipeline('https://example.com', {
			fmProps: new Map(),
			tagSettings: DEFAULT_TAG_SETTINGS,
			frontmatterOnly: true,
			processors: {
				document: [],
				article: [{
					id: 'article-marker',
					process: (article: IArticle) => ({ ...article, marker: true }),
				}],
				markdown: [],
			},
		});

		expect(result.content).toBe('');
		expect((result as unknown as Record<string, unknown>).marker).toBe(true);
	});

	it('DEFAULT_SLURP_PROCESSORS markdown processor runs convertMathDelimiters', async () => {
		(parse.parseMarkdown as jest.Mock).mockReturnValue('Inline \\(x\\)');
		(parse.convertMathDelimiters as jest.Mock).mockImplementation(
			jest.requireActual('../src/parse').convertMathDelimiters,
		);

		const result = await slurpPipeline('https://example.com', {
			fmProps: new Map(),
			tagSettings: DEFAULT_TAG_SETTINGS,
			frontmatterOnly: false,
			processors: DEFAULT_SLURP_PROCESSORS,
		});

		expect(result.content).toBe('Inline $x$');
	});
});
