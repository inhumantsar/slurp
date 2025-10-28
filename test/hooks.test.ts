import { JSDOM } from 'jsdom';
import { hookManager } from '../src/hooks';

describe('hookManager', () => {
    beforeEach(() => {
        // Clear all hooks before each test
        hookManager.clearHooks();
    });

    describe('beforeSimplification hooks', () => {
        it('should execute universal hooks', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><h1>Test</h1></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';

            let executed = false;
            hookManager.registerBeforeSimplification((doc, url) => {
                executed = true;
                return doc;
            });

            hookManager.executeBeforeSimplification(doc, url);
            expect(executed).toBe(true);
        });

        it('should execute site-specific hooks matching URL pattern', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><h1>Test</h1></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';

            let executed = false;
            hookManager.registerBeforeSimplification(
                (doc, url) => {
                    executed = true;
                    return doc;
                },
                /example\.com/
            );

            hookManager.executeBeforeSimplification(doc, url);
            expect(executed).toBe(true);
        });

        it('should not execute hooks with non-matching URL pattern', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><h1>Test</h1></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';

            let executed = false;
            hookManager.registerBeforeSimplification(
                (doc, url) => {
                    executed = true;
                    return doc;
                },
                /different\.com/
            );

            hookManager.executeBeforeSimplification(doc, url);
            expect(executed).toBe(false);
        });

        it('should modify document and pass changes through', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><h1>Test</h1></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';

            hookManager.registerBeforeSimplification((doc, url) => {
                const h1 = doc.querySelector('h1');
                if (h1) h1.textContent = 'Modified';
                return doc;
            });

            const result = hookManager.executeBeforeSimplification(doc, url);
            expect(result.querySelector('h1')?.textContent).toBe('Modified');
        });

        it('should execute multiple hooks in order', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><div id="test"></div></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';

            hookManager.registerBeforeSimplification((doc, url) => {
                const div = doc.querySelector('#test');
                if (div) div.textContent = 'First';
                return doc;
            });

            hookManager.registerBeforeSimplification((doc, url) => {
                const div = doc.querySelector('#test');
                if (div) div.textContent += ' Second';
                return doc;
            });

            const result = hookManager.executeBeforeSimplification(doc, url);
            expect(result.querySelector('#test')?.textContent).toBe('First Second');
        });
    });

    describe('beforeMarkdownConversion hooks', () => {
        it('should execute universal hooks', () => {
            const html = '<p>Test content</p>';
            const url = 'https://example.com/test';

            let executed = false;
            hookManager.registerBeforeMarkdownConversion((html, url) => {
                executed = true;
                return html;
            });

            hookManager.executeBeforeMarkdownConversion(html, url);
            expect(executed).toBe(true);
        });

        it('should execute site-specific hooks matching URL pattern', () => {
            const html = '<p>Test content</p>';
            const url = 'https://example.com/test';

            let executed = false;
            hookManager.registerBeforeMarkdownConversion(
                (html, url) => {
                    executed = true;
                    return html;
                },
                /example\.com/
            );

            hookManager.executeBeforeMarkdownConversion(html, url);
            expect(executed).toBe(true);
        });

        it('should not execute hooks with non-matching URL pattern', () => {
            const html = '<p>Test content</p>';
            const url = 'https://example.com/test';

            let executed = false;
            hookManager.registerBeforeMarkdownConversion(
                (html, url) => {
                    executed = true;
                    return html;
                },
                /different\.com/
            );

            hookManager.executeBeforeMarkdownConversion(html, url);
            expect(executed).toBe(false);
        });

        it('should modify HTML and pass changes through', () => {
            const html = '<p>Original content</p>';
            const url = 'https://example.com/test';

            hookManager.registerBeforeMarkdownConversion((html, url) => {
                return html.replace('Original', 'Modified');
            });

            const result = hookManager.executeBeforeMarkdownConversion(html, url);
            expect(result).toBe('<p>Modified content</p>');
        });

        it('should execute multiple hooks in order', () => {
            const html = '<p>Test</p>';
            const url = 'https://example.com/test';

            hookManager.registerBeforeMarkdownConversion((html, url) => {
                return html.replace('Test', 'First');
            });

            hookManager.registerBeforeMarkdownConversion((html, url) => {
                return html.replace('First', 'Second');
            });

            const result = hookManager.executeBeforeMarkdownConversion(html, url);
            expect(result).toBe('<p>Second</p>');
        });
    });

    describe('afterMarkdownConversion hooks', () => {
        it('should execute universal hooks', () => {
            const markdown = '# Test content';
            const url = 'https://example.com/test';

            let executed = false;
            hookManager.registerAfterMarkdownConversion((md, url) => {
                executed = true;
                return md;
            });

            hookManager.executeAfterMarkdownConversion(markdown, url);
            expect(executed).toBe(true);
        });

        it('should execute site-specific hooks matching URL pattern', () => {
            const markdown = '# Test content';
            const url = 'https://example.com/test';

            let executed = false;
            hookManager.registerAfterMarkdownConversion(
                (md, url) => {
                    executed = true;
                    return md;
                },
                /example\.com/
            );

            hookManager.executeAfterMarkdownConversion(markdown, url);
            expect(executed).toBe(true);
        });

        it('should not execute hooks with non-matching URL pattern', () => {
            const markdown = '# Test content';
            const url = 'https://example.com/test';

            let executed = false;
            hookManager.registerAfterMarkdownConversion(
                (md, url) => {
                    executed = true;
                    return md;
                },
                /different\.com/
            );

            hookManager.executeAfterMarkdownConversion(markdown, url);
            expect(executed).toBe(false);
        });

        it('should modify markdown and pass changes through', () => {
            const markdown = '# Original Title';
            const url = 'https://example.com/test';

            hookManager.registerAfterMarkdownConversion((md, url) => {
                return md.replace('Original', 'Modified');
            });

            const result = hookManager.executeAfterMarkdownConversion(markdown, url);
            expect(result).toBe('# Modified Title');
        });

        it('should execute multiple hooks in order', () => {
            const markdown = '# Test';
            const url = 'https://example.com/test';

            hookManager.registerAfterMarkdownConversion((md, url) => {
                return md.replace('Test', 'First');
            });

            hookManager.registerAfterMarkdownConversion((md, url) => {
                return md.replace('First', 'Second');
            });

            const result = hookManager.executeAfterMarkdownConversion(markdown, url);
            expect(result).toBe('# Second');
        });
    });

    describe('clearHooks', () => {
        it('should clear all registered hooks', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><h1>Test</h1></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';

            let executed = false;
            hookManager.registerBeforeSimplification((doc, url) => {
                executed = true;
                return doc;
            });

            hookManager.clearHooks();
            hookManager.executeBeforeSimplification(doc, url);
            expect(executed).toBe(false);
        });
    });

    describe('error handling', () => {
        it('should continue execution if a hook throws an error', () => {
            const dom = new JSDOM('<!DOCTYPE html><html><body><div id="test"></div></body></html>');
            const doc = dom.window.document;
            const url = 'https://example.com/test';

            hookManager.registerBeforeSimplification((doc, url) => {
                throw new Error('Hook error');
            });

            hookManager.registerBeforeSimplification((doc, url) => {
                const div = doc.querySelector('#test');
                if (div) div.textContent = 'Modified';
                return doc;
            });

            const result = hookManager.executeBeforeSimplification(doc, url);
            expect(result.querySelector('#test')?.textContent).toBe('Modified');
        });
    });

    describe('mixed universal and site-specific hooks', () => {
        it('should execute both universal and matching site-specific hooks', () => {
            const markdown = 'Original';
            const url = 'https://example.com/test';

            let universalExecuted = false;
            let siteSpecificExecuted = false;

            hookManager.registerAfterMarkdownConversion((md, url) => {
                universalExecuted = true;
                return md.replace('Original', 'Universal');
            });

            hookManager.registerAfterMarkdownConversion(
                (md, url) => {
                    siteSpecificExecuted = true;
                    return md.replace('Universal', 'SiteSpecific');
                },
                /example\.com/
            );

            const result = hookManager.executeAfterMarkdownConversion(markdown, url);
            expect(universalExecuted).toBe(true);
            expect(siteSpecificExecuted).toBe(true);
            expect(result).toBe('SiteSpecific');
        });

        it('should only execute universal hooks when site-specific pattern does not match', () => {
            const markdown = 'Original';
            const url = 'https://other.com/test';

            let universalExecuted = false;
            let siteSpecificExecuted = false;

            hookManager.registerAfterMarkdownConversion((md, url) => {
                universalExecuted = true;
                return md.replace('Original', 'Universal');
            });

            hookManager.registerAfterMarkdownConversion(
                (md, url) => {
                    siteSpecificExecuted = true;
                    return md.replace('Universal', 'SiteSpecific');
                },
                /example\.com/
            );

            const result = hookManager.executeAfterMarkdownConversion(markdown, url);
            expect(universalExecuted).toBe(true);
            expect(siteSpecificExecuted).toBe(false);
            expect(result).toBe('Universal');
        });
    });
});
