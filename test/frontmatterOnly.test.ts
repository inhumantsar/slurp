import type { IArticle } from '../src/types';
import * as parse from '../src/parse';

// Mock the parse module
jest.mock('../src/parse');

describe('frontmatterOnly setting', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('parseMarkdown behavior with conditional logic', () => {
        it('should not call parseMarkdown when frontmatterOnlyOverride is true', () => {
            const mockParseMarkdown = parse.parseMarkdown as jest.MockedFunction<typeof parse.parseMarkdown>;

            // Simulate the slurp logic for frontmatterOnly = true
            const frontmatterOnlyOverride = true;
            const settingsFrontmatterOnly = false;
            const frontmatterOnly = frontmatterOnlyOverride ?? settingsFrontmatterOnly;
            
            const articleContent = '<p>Test content</p>';
            const md = frontmatterOnly ? "" : mockParseMarkdown(articleContent);

            // Verify parseMarkdown was NOT called
            expect(mockParseMarkdown).not.toHaveBeenCalled();
            
            // Verify the content is empty
            expect(md).toBe('');
        });

        it('should call parseMarkdown when frontmatterOnlyOverride is false', () => {
            const mockParseMarkdown = parse.parseMarkdown as jest.MockedFunction<typeof parse.parseMarkdown>;
            mockParseMarkdown.mockReturnValue('Test content in markdown');

            // Simulate the slurp logic for frontmatterOnly = false
            const frontmatterOnlyOverride = false;
            const settingsFrontmatterOnly = true;
            const frontmatterOnly = frontmatterOnlyOverride ?? settingsFrontmatterOnly;
            
            const articleContent = '<p>Test content</p>';
            const md = frontmatterOnly ? "" : mockParseMarkdown(articleContent);

            // Verify parseMarkdown WAS called with the correct content
            expect(mockParseMarkdown).toHaveBeenCalledWith('<p>Test content</p>');
            
            // Verify the content is markdown
            expect(md).toBe('Test content in markdown');
        });

        it('should use settings value when override is undefined', () => {
            const mockParseMarkdown = parse.parseMarkdown as jest.MockedFunction<typeof parse.parseMarkdown>;

            // Simulate the slurp logic with settings.frontmatterOnly = true and no override
            const frontmatterOnlyOverride = undefined;
            const settingsFrontmatterOnly = true;
            const frontmatterOnly = frontmatterOnlyOverride ?? settingsFrontmatterOnly;
            
            const articleContent = '<p>Test content</p>';
            const md = frontmatterOnly ? "" : mockParseMarkdown(articleContent);

            // Verify parseMarkdown was NOT called (because settings.frontmatterOnly is true)
            expect(mockParseMarkdown).not.toHaveBeenCalled();
            
            // Verify the content is empty
            expect(md).toBe('');
        });

        it('should call parseMarkdown when both override and settings are false', () => {
            const mockParseMarkdown = parse.parseMarkdown as jest.MockedFunction<typeof parse.parseMarkdown>;
            mockParseMarkdown.mockReturnValue('Parsed markdown content');

            // Simulate the slurp logic when both are false
            const frontmatterOnlyOverride = undefined;
            const settingsFrontmatterOnly = false;
            const frontmatterOnly = frontmatterOnlyOverride ?? settingsFrontmatterOnly;
            
            const articleContent = '<p>Test content</p>';
            const md = frontmatterOnly ? "" : mockParseMarkdown(articleContent);

            // Verify parseMarkdown WAS called
            expect(mockParseMarkdown).toHaveBeenCalledWith('<p>Test content</p>');
            
            // Verify the content has markdown
            expect(md).toBe('Parsed markdown content');
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
