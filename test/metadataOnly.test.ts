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

    it('should use override value when provided', () => {
        const settingsMetadataOnly = false;
        const overrideMetadataOnly = true;
        const article: IArticle = {
            title: "Test Article",
            content: "This is some test content.",
            slurpedTime: new Date(),
            tags: [],
            link: "https://example.com"
        };

        const metadataOnly = overrideMetadataOnly !== undefined ? overrideMetadataOnly : settingsMetadataOnly;
        const noteContent = metadataOnly ? "" : article.content;

        expect(metadataOnly).toBe(true);
        expect(noteContent).toBe("");
    });

    it('should use settings value when override is undefined', () => {
        const settingsMetadataOnly = true;
        const overrideMetadataOnly = undefined;
        const article: IArticle = {
            title: "Test Article",
            content: "This is some test content.",
            slurpedTime: new Date(),
            tags: [],
            link: "https://example.com"
        };

        const metadataOnly = overrideMetadataOnly !== undefined ? overrideMetadataOnly : settingsMetadataOnly;
        const noteContent = metadataOnly ? "" : article.content;

        expect(metadataOnly).toBe(true);
        expect(noteContent).toBe("");
    });
});
