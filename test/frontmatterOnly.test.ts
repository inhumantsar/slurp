import type { IArticle } from '../src/types';
import * as parse from '../src/parse';
import { JSDOM } from 'jsdom';

// Mock the parse module
jest.mock('../src/parse');

// Mock the main module to avoid loading Obsidian dependencies
jest.mock('../main', () => {
    return {
        default: class MockSlurpPlugin {
            logger: any;
            settings: any;
            fmProps: any;
            slurpNewNoteCallback: any;
            displayError: any;

            async slurp(url: string, frontmatterOnlyOverride?: boolean): Promise<void> {
                // Import the actual implementation
                const { fetchHtml, parsePage, parseMetadata, mergeMetadata, parseMarkdown } = require('../src/parse');
                const { JSDOM } = require('jsdom');
                
                this.logger.debug("slurping", {url});
                try {
                    const htmlString = await fetchHtml(url);
                    const dom = new JSDOM(htmlString);
                    const doc = dom.window.document;

                    const article = {
                        slurpedTime: new Date(),
                        tags: [],
                        ...parsePage(doc)
                    };
                    this.logger.debug("parsed page", article);

                    const parsedMetadata = parseMetadata(doc, this.fmProps, this.settings.fm.tags.prefix, this.settings.fm.tags.case);
                    this.logger.debug("parsed metadata", parsedMetadata);

                    const mergedMetadata = mergeMetadata(article, parsedMetadata);
                    this.logger.debug("merged metadata", parsedMetadata);

                    const frontmatterOnly = frontmatterOnlyOverride ?? this.settings.frontmatterOnly;
                    const md = frontmatterOnly ? "" : parseMarkdown(article.content);
                    this.logger.debug(frontmatterOnly ? "skipping markdown conversion" : "converted page to markdown", md);

                    await this.slurpNewNoteCallback({
                        ...mergedMetadata,
                        content: md,
                        link: url
                    });
                } catch (err) {
                    this.logger.error("Unable to Slurp page", {url, err: (err as Error).message});
                    this.displayError(err as Error);
                }
            }
        }
    };
});

describe('frontmatterOnly setting', () => {
    let mockPlugin: any;
    let SlurpPlugin: any;
    
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Import the mocked module
        SlurpPlugin = require('../main').default;
        
        // Create a mock plugin instance
        mockPlugin = new SlurpPlugin();
        mockPlugin.logger = {
            debug: jest.fn(),
            error: jest.fn(),
        };
        mockPlugin.settings = {
            frontmatterOnly: false,
            fm: {
                tags: {
                    prefix: 'test/',
                    case: 'iKebab-case',
                },
            },
        };
        mockPlugin.fmProps = new Map();
        mockPlugin.slurpNewNoteCallback = jest.fn();
        mockPlugin.displayError = jest.fn();
    });

    describe('slurp() with frontmatterOnly mode', () => {
        it('should not call parseMarkdown when frontmatterOnlyOverride is true', async () => {
            const mockFetchHtml = parse.fetchHtml as jest.MockedFunction<typeof parse.fetchHtml>;
            const mockParsePage = parse.parsePage as jest.MockedFunction<typeof parse.parsePage>;
            const mockParseMetadata = parse.parseMetadata as jest.MockedFunction<typeof parse.parseMetadata>;
            const mockMergeMetadata = parse.mergeMetadata as jest.MockedFunction<typeof parse.mergeMetadata>;
            const mockParseMarkdown = parse.parseMarkdown as jest.MockedFunction<typeof parse.parseMarkdown>;

            // Setup mocks
            mockFetchHtml.mockResolvedValue('<html><body><h1>Test Article</h1><p>Test content</p></body></html>');
            mockParsePage.mockReturnValue({
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
            });
            mockParseMetadata.mockReturnValue({
                slurpedTime: new Date(),
                tags: [],
            });
            mockMergeMetadata.mockImplementation((article, metadata) => ({
                ...article,
                ...metadata,
            }));
            mockParseMarkdown.mockReturnValue('Test content in markdown');

            // Call slurp with frontmatterOnlyOverride = true
            await mockPlugin.slurp('https://example.com', true);

            // Verify parseMarkdown was NOT called
            expect(mockParseMarkdown).not.toHaveBeenCalled();

            // Verify slurpNewNoteCallback was called with empty content
            expect(mockPlugin.slurpNewNoteCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Test Article',
                    content: '',
                    link: 'https://example.com',
                })
            );
        });

        it('should call parseMarkdown when frontmatterOnlyOverride is false', async () => {
            const mockFetchHtml = parse.fetchHtml as jest.MockedFunction<typeof parse.fetchHtml>;
            const mockParsePage = parse.parsePage as jest.MockedFunction<typeof parse.parsePage>;
            const mockParseMetadata = parse.parseMetadata as jest.MockedFunction<typeof parse.parseMetadata>;
            const mockMergeMetadata = parse.mergeMetadata as jest.MockedFunction<typeof parse.mergeMetadata>;
            const mockParseMarkdown = parse.parseMarkdown as jest.MockedFunction<typeof parse.parseMarkdown>;

            // Setup mocks
            mockFetchHtml.mockResolvedValue('<html><body><h1>Test Article</h1><p>Test content</p></body></html>');
            mockParsePage.mockReturnValue({
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
            });
            mockParseMetadata.mockReturnValue({
                slurpedTime: new Date(),
                tags: [],
            });
            mockMergeMetadata.mockImplementation((article, metadata) => ({
                ...article,
                ...metadata,
            }));
            mockParseMarkdown.mockReturnValue('Test content in markdown');

            // Call slurp with frontmatterOnlyOverride = false
            await mockPlugin.slurp('https://example.com', false);

            // Verify parseMarkdown WAS called
            expect(mockParseMarkdown).toHaveBeenCalledWith('<p>Test content</p>');

            // Verify slurpNewNoteCallback was called with markdown content
            expect(mockPlugin.slurpNewNoteCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Test Article',
                    content: 'Test content in markdown',
                    link: 'https://example.com',
                })
            );
        });

        it('should use settings value when override is undefined and settings is true', async () => {
            const mockFetchHtml = parse.fetchHtml as jest.MockedFunction<typeof parse.fetchHtml>;
            const mockParsePage = parse.parsePage as jest.MockedFunction<typeof parse.parsePage>;
            const mockParseMetadata = parse.parseMetadata as jest.MockedFunction<typeof parse.parseMetadata>;
            const mockMergeMetadata = parse.mergeMetadata as jest.MockedFunction<typeof parse.mergeMetadata>;
            const mockParseMarkdown = parse.parseMarkdown as jest.MockedFunction<typeof parse.parseMarkdown>;

            // Setup mocks
            mockFetchHtml.mockResolvedValue('<html><body><h1>Test Article</h1><p>Test content</p></body></html>');
            mockParsePage.mockReturnValue({
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
            });
            mockParseMetadata.mockReturnValue({
                slurpedTime: new Date(),
                tags: [],
            });
            mockMergeMetadata.mockImplementation((article, metadata) => ({
                ...article,
                ...metadata,
            }));

            // Set settings to frontmatterOnly = true
            mockPlugin.settings.frontmatterOnly = true;

            // Call slurp without override (should use settings value)
            await mockPlugin.slurp('https://example.com');

            // Verify parseMarkdown was NOT called (because settings.frontmatterOnly is true)
            expect(mockParseMarkdown).not.toHaveBeenCalled();

            // Verify slurpNewNoteCallback was called with empty content
            expect(mockPlugin.slurpNewNoteCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Test Article',
                    content: '',
                    link: 'https://example.com',
                })
            );
        });

        it('should call parseMarkdown when both override and settings are false', async () => {
            const mockFetchHtml = parse.fetchHtml as jest.MockedFunction<typeof parse.fetchHtml>;
            const mockParsePage = parse.parsePage as jest.MockedFunction<typeof parse.parsePage>;
            const mockParseMetadata = parse.parseMetadata as jest.MockedFunction<typeof parse.parseMetadata>;
            const mockMergeMetadata = parse.mergeMetadata as jest.MockedFunction<typeof parse.mergeMetadata>;
            const mockParseMarkdown = parse.parseMarkdown as jest.MockedFunction<typeof parse.parseMarkdown>;

            // Setup mocks
            mockFetchHtml.mockResolvedValue('<html><body><h1>Test Article</h1><p>Test content</p></body></html>');
            mockParsePage.mockReturnValue({
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
            });
            mockParseMetadata.mockReturnValue({
                slurpedTime: new Date(),
                tags: [],
            });
            mockMergeMetadata.mockImplementation((article, metadata) => ({
                ...article,
                ...metadata,
            }));
            mockParseMarkdown.mockReturnValue('Parsed markdown content');

            // Set settings to frontmatterOnly = false
            mockPlugin.settings.frontmatterOnly = false;

            // Call slurp without override
            await mockPlugin.slurp('https://example.com');

            // Verify parseMarkdown WAS called
            expect(mockParseMarkdown).toHaveBeenCalledWith('<p>Test content</p>');

            // Verify slurpNewNoteCallback was called with markdown content
            expect(mockPlugin.slurpNewNoteCallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    title: 'Test Article',
                    content: 'Parsed markdown content',
                    link: 'https://example.com',
                })
            );
        });
    });

    describe('slurpNewNoteCallback content handling', () => {
        it('should create empty note content when article.content is empty', () => {
            const article: IArticle = {
                title: "Test Article",
                content: "",
                slurpedTime: new Date(),
                tags: [],
                link: "https://example.com"
            };

            const frontMatter = "title: Test Article\nlink: https://example.com";
            const content = `---\n${frontMatter}\n---\n\n${article.content}`;

            expect(content).toContain("---\n");
            expect(content).toContain("title: Test Article");
            expect(content).toMatch(/---\n\n$/); // Ends with --- and double newline
        });

        it('should include content when article.content has markdown', () => {
            const article: IArticle = {
                title: "Test Article",
                content: "This is some markdown content.",
                slurpedTime: new Date(),
                tags: [],
                link: "https://example.com"
            };

            const frontMatter = "title: Test Article\nlink: https://example.com";
            const content = `---\n${frontMatter}\n---\n\n${article.content}`;

            expect(content).toContain("---\n");
            expect(content).toContain("title: Test Article");
            expect(content).toContain("This is some markdown content.");
        });
    });
});
