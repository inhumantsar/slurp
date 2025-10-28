import type { IArticle } from '../src/types';

describe('metadataOnly setting', () => {
    it('should create empty content when metadataOnly is true', () => {
        const metadataOnly = true;
        const article: IArticle = {
            title: "Test Article",
            content: "This is some test content that should not be included.",
            slurpedTime: new Date(),
            tags: [],
            link: "https://example.com"
        };

        const noteContent = metadataOnly ? "" : article.content;
        const frontMatter = "title: Test Article\nlink: https://example.com";
        const content = `---\n${frontMatter}\n---\n\n${noteContent}`;

        expect(content).toContain("---\n");
        expect(content).toContain("title: Test Article");
        expect(content).not.toContain("This is some test content");
        expect(noteContent).toBe("");
    });

    it('should include content when metadataOnly is false', () => {
        const metadataOnly = false;
        const article: IArticle = {
            title: "Test Article",
            content: "This is some test content that should be included.",
            slurpedTime: new Date(),
            tags: [],
            link: "https://example.com"
        };

        const noteContent = metadataOnly ? "" : article.content;
        const frontMatter = "title: Test Article\nlink: https://example.com";
        const content = `---\n${frontMatter}\n---\n\n${noteContent}`;

        expect(content).toContain("---\n");
        expect(content).toContain("title: Test Article");
        expect(content).toContain("This is some test content that should be included.");
        expect(noteContent).toBe(article.content);
    });
});
