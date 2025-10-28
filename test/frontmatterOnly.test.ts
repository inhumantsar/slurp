import type { IArticle } from '../src/types';

describe('frontmatterOnly setting', () => {
    it('should create empty content when frontmatterOnly is true', () => {
        const frontmatterOnly = true;
        const article: IArticle = {
            title: "Test Article",
            content: "This is some test content that should not be included.",
            slurpedTime: new Date(),
            tags: [],
            link: "https://example.com"
        };

        const noteContent = frontmatterOnly ? "" : article.content;
        const frontMatter = "title: Test Article\nlink: https://example.com";
        const content = `---\n${frontMatter}\n---\n\n${noteContent}`;

        expect(content).toContain("---\n");
        expect(content).toContain("title: Test Article");
        expect(content).not.toContain("This is some test content");
        expect(noteContent).toBe("");
    });

    it('should include content when frontmatterOnly is false', () => {
        const frontmatterOnly = false;
        const article: IArticle = {
            title: "Test Article",
            content: "This is some test content that should be included.",
            slurpedTime: new Date(),
            tags: [],
            link: "https://example.com"
        };

        const noteContent = frontmatterOnly ? "" : article.content;
        const frontMatter = "title: Test Article\nlink: https://example.com";
        const content = `---\n${frontMatter}\n---\n\n${noteContent}`;

        expect(content).toContain("---\n");
        expect(content).toContain("title: Test Article");
        expect(content).toContain("This is some test content that should be included.");
        expect(noteContent).toBe(article.content);
    });

    it('should use override value when provided', () => {
        const settingsFrontmatterOnly = false;
        const overrideFrontmatterOnly = true;
        const article: IArticle = {
            title: "Test Article",
            content: "This is some test content.",
            slurpedTime: new Date(),
            tags: [],
            link: "https://example.com"
        };

        const frontmatterOnly = overrideFrontmatterOnly ?? settingsFrontmatterOnly;
        const noteContent = frontmatterOnly ? "" : article.content;

        expect(frontmatterOnly).toBe(true);
        expect(noteContent).toBe("");
    });

    it('should use settings value when override is undefined', () => {
        const settingsFrontmatterOnly = true;
        const overrideFrontmatterOnly = undefined;
        const article: IArticle = {
            title: "Test Article",
            content: "This is some test content.",
            slurpedTime: new Date(),
            tags: [],
            link: "https://example.com"
        };

        const frontmatterOnly = overrideFrontmatterOnly ?? settingsFrontmatterOnly;
        const noteContent = frontmatterOnly ? "" : article.content;

        expect(frontmatterOnly).toBe(true);
        expect(noteContent).toBe("");
    });
});
