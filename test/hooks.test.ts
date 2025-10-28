import { JSDOM } from 'jsdom';
import { hookManager } from '../src/hooks';
import type { IArticle } from '../src/types';

describe('hookManager', () => {
    // Helper to create a basic article object for testing
    const createTestArticle = (): IArticle => ({
        title: 'Test Article',
        content: '<p>Test content</p>',
        slurpedTime: new Date(),
        tags: []
    });

    beforeEach(() => {
        // Clear all hooks before each test
        hookManager.clearHooks();
    });

    describe('beforeSimplification hooks', () => {
        it('should execute universal hooks', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><h1>Test</h1></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';
            const article = createTestArticle();

            let executed = false;
            hookManager.registerBeforeSimplification((doc, url, article) => {
                executed = true;
                return { doc };
            });

            hookManager.executeBeforeSimplification(doc, url, article);
            expect(executed).toBe(true);
        });

        it('should execute site-specific hooks matching URL pattern', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><h1>Test</h1></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';
            const article = createTestArticle();

            let executed = false;
            hookManager.registerBeforeSimplification(
                (doc, url, article) => {
                    executed = true;
                    return { doc };
                },
                /example\.com/
            );

            hookManager.executeBeforeSimplification(doc, url, article);
            expect(executed).toBe(true);
        });

        it('should not execute hooks with non-matching URL pattern', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><h1>Test</h1></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';
            const article = createTestArticle();

            let executed = false;
            hookManager.registerBeforeSimplification(
                (doc, url, article) => {
                    executed = true;
                    return { doc };
                },
                /different\.com/
            );

            hookManager.executeBeforeSimplification(doc, url, article);
            expect(executed).toBe(false);
        });

        it('should modify document and pass changes through', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><h1>Test</h1></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';
            const article = createTestArticle();

            hookManager.registerBeforeSimplification((doc, url, article) => {
                const h1 = doc.querySelector('h1');
                if (h1) h1.textContent = 'Modified';
                return { doc };
            });

            const result = hookManager.executeBeforeSimplification(doc, url, article);
            expect(result.doc.querySelector('h1')?.textContent).toBe('Modified');
        });

        it('should execute multiple hooks in order', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><div id="test"></div></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';
            const article = createTestArticle();

            hookManager.registerBeforeSimplification((doc, url, article) => {
                const div = doc.querySelector('#test');
                if (div) div.textContent = 'First';
                return { doc };
            });

            hookManager.registerBeforeSimplification((doc, url, article) => {
                const div = doc.querySelector('#test');
                if (div) div.textContent += ' Second';
                return { doc };
            });

            const result = hookManager.executeBeforeSimplification(doc, url, article);
            expect(result.doc.querySelector('#test')?.textContent).toBe('First Second');
        });

        it('should merge metadata from hooks', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><h1>Test</h1></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';
            const article = createTestArticle();

            hookManager.registerBeforeSimplification((doc, url, article) => {
                return {
                    doc,
                    metadata: {
                        slurpedTime: new Date(),
                        tags: [],
                        byline: 'Test Author'
                    }
                };
            });

            const result = hookManager.executeBeforeSimplification(doc, url, article);
            expect(result.article.byline).toBe('Test Author');
        });
    });

    describe('beforeMarkdownConversion hooks', () => {
        it('should execute universal hooks', () => {
            const html = '<p>Test content</p>';
            const url = 'https://example.com/test';
            const article = createTestArticle();

            let executed = false;
            hookManager.registerBeforeMarkdownConversion((html, url, article) => {
                executed = true;
                return { html };
            });

            hookManager.executeBeforeMarkdownConversion(html, url, article);
            expect(executed).toBe(true);
        });

        it('should execute site-specific hooks matching URL pattern', () => {
            const html = '<p>Test content</p>';
            const url = 'https://example.com/test';
            const article = createTestArticle();

            let executed = false;
            hookManager.registerBeforeMarkdownConversion(
                (html, url, article) => {
                    executed = true;
                    return { html };
                },
                /example\.com/
            );

            hookManager.executeBeforeMarkdownConversion(html, url, article);
            expect(executed).toBe(true);
        });

        it('should not execute hooks with non-matching URL pattern', () => {
            const html = '<p>Test content</p>';
            const url = 'https://example.com/test';
            const article = createTestArticle();

            let executed = false;
            hookManager.registerBeforeMarkdownConversion(
                (html, url, article) => {
                    executed = true;
                    return { html };
                },
                /different\.com/
            );

            hookManager.executeBeforeMarkdownConversion(html, url, article);
            expect(executed).toBe(false);
        });

        it('should modify HTML and pass changes through', () => {
            const html = '<p>Original content</p>';
            const url = 'https://example.com/test';
            const article = createTestArticle();

            hookManager.registerBeforeMarkdownConversion((html, url, article) => {
                return { html: html.replace('Original', 'Modified') };
            });

            const result = hookManager.executeBeforeMarkdownConversion(html, url, article);
            expect(result.html).toBe('<p>Modified content</p>');
        });

        it('should execute multiple hooks in order', () => {
            const html = '<p>Test</p>';
            const url = 'https://example.com/test';
            const article = createTestArticle();

            hookManager.registerBeforeMarkdownConversion((html, url, article) => {
                return { html: html.replace('Test', 'First') };
            });

            hookManager.registerBeforeMarkdownConversion((html, url, article) => {
                return { html: html.replace('First', 'Second') };
            });

            const result = hookManager.executeBeforeMarkdownConversion(html, url, article);
            expect(result.html).toBe('<p>Second</p>');
        });

        it('should merge metadata from hooks', () => {
            const html = '<p>Test content</p>';
            const url = 'https://example.com/test';
            const article = createTestArticle();

            hookManager.registerBeforeMarkdownConversion((html, url, article) => {
                return {
                    html,
                    metadata: {
                        slurpedTime: new Date(),
                        tags: [],
                        excerpt: 'Test excerpt'
                    }
                };
            });

            const result = hookManager.executeBeforeMarkdownConversion(html, url, article);
            expect(result.article.excerpt).toBe('Test excerpt');
        });
    });

    describe('afterMarkdownConversion hooks', () => {
        it('should execute universal hooks', () => {
            const markdown = '# Test content';
            const url = 'https://example.com/test';
            const article = createTestArticle();

            let executed = false;
            hookManager.registerAfterMarkdownConversion((md, url, article) => {
                executed = true;
                return { markdown: md };
            });

            hookManager.executeAfterMarkdownConversion(markdown, url, article);
            expect(executed).toBe(true);
        });

        it('should execute site-specific hooks matching URL pattern', () => {
            const markdown = '# Test content';
            const url = 'https://example.com/test';
            const article = createTestArticle();

            let executed = false;
            hookManager.registerAfterMarkdownConversion(
                (md, url, article) => {
                    executed = true;
                    return { markdown: md };
                },
                /example\.com/
            );

            hookManager.executeAfterMarkdownConversion(markdown, url, article);
            expect(executed).toBe(true);
        });

        it('should not execute hooks with non-matching URL pattern', () => {
            const markdown = '# Test content';
            const url = 'https://example.com/test';
            const article = createTestArticle();

            let executed = false;
            hookManager.registerAfterMarkdownConversion(
                (md, url, article) => {
                    executed = true;
                    return { markdown: md };
                },
                /different\.com/
            );

            hookManager.executeAfterMarkdownConversion(markdown, url, article);
            expect(executed).toBe(false);
        });

        it('should modify markdown and pass changes through', () => {
            const markdown = '# Original Title';
            const url = 'https://example.com/test';
            const article = createTestArticle();

            hookManager.registerAfterMarkdownConversion((md, url, article) => {
                return { markdown: md.replace('Original', 'Modified') };
            });

            const result = hookManager.executeAfterMarkdownConversion(markdown, url, article);
            expect(result.markdown).toBe('# Modified Title');
        });

        it('should execute multiple hooks in order', () => {
            const markdown = '# Test';
            const url = 'https://example.com/test';
            const article = createTestArticle();

            hookManager.registerAfterMarkdownConversion((md, url, article) => {
                return { markdown: md.replace('Test', 'First') };
            });

            hookManager.registerAfterMarkdownConversion((md, url, article) => {
                return { markdown: md.replace('First', 'Second') };
            });

            const result = hookManager.executeAfterMarkdownConversion(markdown, url, article);
            expect(result.markdown).toBe('# Second');
        });

        it('should merge metadata from hooks', () => {
            const markdown = '# Test';
            const url = 'https://example.com/test';
            const article = createTestArticle();

            hookManager.registerAfterMarkdownConversion((md, url, article) => {
                return {
                    markdown: md,
                    metadata: {
                        slurpedTime: new Date(),
                        tags: [],
                        siteName: 'Test Site'
                    }
                };
            });

            const result = hookManager.executeAfterMarkdownConversion(markdown, url, article);
            expect(result.article.siteName).toBe('Test Site');
        });
    });

    describe('clearHooks', () => {
        it('should clear all registered hooks', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><h1>Test</h1></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';
            const article = createTestArticle();

            let executed = false;
            hookManager.registerBeforeSimplification((doc, url, article) => {
                executed = true;
                return { doc };
            });

            hookManager.clearHooks();
            hookManager.executeBeforeSimplification(doc, url, article);
            expect(executed).toBe(false);
        });
    });

    describe('error handling', () => {
        it('should continue execution if a hook throws an error', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><div id="test"></div></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';
            const article = createTestArticle();

            hookManager.registerBeforeSimplification((doc, url, article) => {
                throw new Error('Hook error');
            });

            hookManager.registerBeforeSimplification((doc, url, article) => {
                const div = doc.querySelector('#test');
                if (div) div.textContent = 'Modified';
                return { doc };
            });

            const result = hookManager.executeBeforeSimplification(doc, url, article);
            expect(result.doc.querySelector('#test')?.textContent).toBe('Modified');
        });
    });

    describe('mixed universal and site-specific hooks', () => {
        it('should execute both universal and matching site-specific hooks', () => {
            const markdown = 'Original';
            const url = 'https://example.com/test';
            const article = createTestArticle();

            let universalExecuted = false;
            let siteSpecificExecuted = false;

            hookManager.registerAfterMarkdownConversion((md, url, article) => {
                universalExecuted = true;
                return { markdown: md.replace('Original', 'Universal') };
            });

            hookManager.registerAfterMarkdownConversion(
                (md, url, article) => {
                    siteSpecificExecuted = true;
                    return { markdown: md.replace('Universal', 'SiteSpecific') };
                },
                /example\.com/
            );

            const result = hookManager.executeAfterMarkdownConversion(markdown, url, article);
            expect(universalExecuted).toBe(true);
            expect(siteSpecificExecuted).toBe(true);
            expect(result.markdown).toBe('SiteSpecific');
        });

        it('should only execute universal hooks when site-specific pattern does not match', () => {
            const markdown = 'Original';
            const url = 'https://other.com/test';
            const article = createTestArticle();

            let universalExecuted = false;
            let siteSpecificExecuted = false;

            hookManager.registerAfterMarkdownConversion((md, url, article) => {
                universalExecuted = true;
                return { markdown: md.replace('Original', 'Universal') };
            });

            hookManager.registerAfterMarkdownConversion(
                (md, url, article) => {
                    siteSpecificExecuted = true;
                    return { markdown: md.replace('Universal', 'SiteSpecific') };
                },
                /example\.com/
            );

            const result = hookManager.executeAfterMarkdownConversion(markdown, url, article);
            expect(universalExecuted).toBe(true);
            expect(siteSpecificExecuted).toBe(false);
            expect(result.markdown).toBe('Universal');
        });
    });
});
