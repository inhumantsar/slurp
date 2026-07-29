import type { IArticle } from '../src/types';
import * as parse from '../src/parse';
import { slurpPipeline } from '../src/pipeline';
import { DEFAULT_SLURP_PROCESSORS } from '../src/processors';

jest.mock('../src/parse');

const FAKE_ARTICLE: IArticle = {
	title: 'Test Article',
	content: '<p>Test content</p>',
	textContent: 'Test content',
	length: 100,
	excerpt: 'Test excerpt',
	byline: 'Test Author',
	dir: 'ltr',
	siteName: 'Test Site',
	lang: 'en',
	publishedTime: '2024-01-01',
	slurpedTime: new Date('2024-06-15'),
	tags: [],
};

const FAKE_METADATA = {
	slurpedTime: new Date('2024-06-15'),
	tags: [],
};

const DEFAULT_FM_PROPS = new Map();
const DEFAULT_TAG_SETTINGS = { parse: true, prefix: 'test/', case: 'iKebab-case' as const };

describe('slurpPipeline frontmatterOnly mode', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		(parse.fetchHtml as jest.Mock).mockResolvedValue(
			'<html><body><h1>Test Article</h1><p>Test content</p></body></html>'
		);
		(parse.parsePage as jest.Mock).mockReturnValue(FAKE_ARTICLE);
		(parse.parseMetadata as jest.Mock).mockReturnValue(FAKE_METADATA);
		(parse.mergeMetadata as jest.Mock).mockImplementation(
			(article: IArticle, metadata: IArticle) => ({
				...article,
				...metadata,
			})
		);
		(parse.convertMathDelimiters as jest.Mock).mockImplementation(
			(markdown: string) => markdown
		);
	});

	it('should not call parseMarkdown when frontmatterOnly is true', async () => {
		(parse.parseMarkdown as jest.Mock).mockReturnValue('Test content in markdown');

		const result = await slurpPipeline(
			'https://example.com',
			{ fmProps: DEFAULT_FM_PROPS, tagSettings: DEFAULT_TAG_SETTINGS, frontmatterOnly: true, processors: DEFAULT_SLURP_PROCESSORS },
		);

		expect(parse.parseMarkdown).not.toHaveBeenCalled();
		expect(result).toMatchObject({
			title: 'Test Article',
			content: '',
			link: 'https://example.com',
		});
	});

	it('should call parseMarkdown when frontmatterOnly is false', async () => {
		(parse.parseMarkdown as jest.Mock).mockReturnValue('Test content in markdown');

		const result = await slurpPipeline(
			'https://example.com',
			{ fmProps: DEFAULT_FM_PROPS, tagSettings: DEFAULT_TAG_SETTINGS, frontmatterOnly: false, processors: DEFAULT_SLURP_PROCESSORS },
		);

		expect(parse.parseMarkdown).toHaveBeenCalledWith('<p>Test content</p>');
		expect(result).toMatchObject({
			title: 'Test Article',
			content: 'Test content in markdown',
			link: 'https://example.com',
		});
	});

	it('should set slurpedTime and tags on every article', async () => {
		(parse.parseMarkdown as jest.Mock).mockReturnValue('');

		const result = await slurpPipeline(
			'https://example.com',
			{ fmProps: DEFAULT_FM_PROPS, tagSettings: DEFAULT_TAG_SETTINGS, frontmatterOnly: true, processors: DEFAULT_SLURP_PROCESSORS },
		);

		expect(result.slurpedTime).toBeInstanceOf(Date);
		expect(Array.isArray(result.tags)).toBe(true);
	});

});
