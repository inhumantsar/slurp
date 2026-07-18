import { JSDOM } from 'jsdom';
import { fixRelativeLinks, mergeMetadata, parseMetadata, parsePage } from '../src/parse';
import type { IArticle, IArticleMetadata, IFrontMatterProp, TFrontMatterProps } from '../src/types';

jest.mock('../src/lib/logger', () => ({
    logger: () => ({ debug: jest.fn(), error: jest.fn() }),
}));

describe('mergeMetadata', () => {
    it('should not contain duplicate tags', () => {
        const tagPrefix = 'slurp';

        const article: IArticle = {
            title: "fake page",
            content: "fake content",
            slurpedTime: new Date(),
            tags:  [
                {prefix: tagPrefix, tag: "moo"},
                {prefix: tagPrefix, tag: "mootoo"},
                {prefix: tagPrefix, tag: "mootoothree"},
            ] 
        };

        const metadata: IArticleMetadata = {
            slurpedTime: new Date(),
            tags: [
                {prefix: tagPrefix, tag: "moo"},
                {prefix: tagPrefix, tag: "mootoo"},
                {prefix: tagPrefix, tag: "mootoothree"},
            ] 
        };

        const result = mergeMetadata(article, metadata);

        expect(result.tags.length).toEqual(3);
    });
});

describe('fixRelativeLinks', () => {
    it('preserves accepted URLs while rewriting relative links', () => {
        const html = '<a href="/absolute">A</a><img src="image.png"><a href="https://other.test/page">B</a>';

        expect(fixRelativeLinks(html, 'https://example.com/articles/page')).toBe(
            '<a href="https://example.com/absolute">A</a>' +
            '<img src="https://example.com/articles/image.png">' +
            '<a href="https://other.test/page">B</a>',
        );
    });
});

describe('parsePage', () => {
    it('extracts representative article fields', () => {
        const doc = new JSDOM(
            '<html><head><title>Fixture article</title><meta name="author" content="Ada"></head>' +
            '<body><article><h1>Fixture article</h1><p>This is representative article content for parsing.</p></article></body></html>',
            { url: 'https://example.com/article' },
        ).window.document;

        const article = parsePage(doc);

        expect(article.title).toBe('Fixture article');
        expect(article.byline).toBe('Ada');
        expect(article.content).toContain('representative article content');
        expect(article.dir).toBeNull();
    });

    it('throws an Error without changing the missing-content message', () => {
        const doc = new JSDOM('<html><body></body></html>').window.document;

        expect(() => parsePage(doc)).toThrow(new Error('No title or content found.'));
    });
});

describe('parseMetadata', () => {
    it('extracts metadata and cleans tags', () => {
        const doc = new JSDOM(
            '<meta name="author" content="Ada Lovelace"><meta name="keywords" content="Math & Logic, C++">',
        ).window.document;
        const properties = new Map<string, IFrontMatterProp>([
            ['byline', { id: 'byline', metaFields: ['author'] } as IFrontMatterProp],
            ['tags', { id: 'tags', metaFields: ['keywords'] } as IFrontMatterProp],
        ]) as TFrontMatterProps;

        const metadata = parseMetadata(doc, properties, 'source/', 'iKebab-case');

        expect(metadata.byline).toBe('Ada Lovelace');
        expect(metadata.tags).toEqual([
            { prefix: 'source/', tag: 'Math-and-Logic' },
            { prefix: 'source/', tag: 'C' },
        ]);
    });
});
