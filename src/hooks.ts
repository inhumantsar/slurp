import { logger } from "./lib/logger";
import { mergeMetadata } from "./parse";
import type { IArticle, IArticleMetadata } from "./types";

/**
 * Result type for hooks that can return content, metadata, or both
 */
export interface IBeforeSimplificationResult {
    doc?: Document;
    metadata?: IArticleMetadata;
}

export interface IBeforeMarkdownConversionResult {
    html?: string;
    metadata?: IArticleMetadata;
}

export interface IAfterMarkdownConversionResult {
    markdown?: string;
    metadata?: IArticleMetadata;
}

/**
 * Hook function type for before simplification (operates on Document)
 */
export type BeforeSimplificationHook = (doc: Document, url: string, article: IArticle) => IBeforeSimplificationResult;

/**
 * Hook function type for before markdown conversion (operates on HTML string)
 */
export type BeforeMarkdownConversionHook = (html: string, url: string, article: IArticle) => IBeforeMarkdownConversionResult;

/**
 * Hook function type for after markdown conversion (operates on markdown string)
 */
export type AfterMarkdownConversionHook = (markdown: string, url: string, article: IArticle) => IAfterMarkdownConversionResult;

/**
 * Represents a registered hook with optional URL pattern matcher
 */
interface IRegisteredHook<T> {
    fn: T;
    pattern?: RegExp;
}

/**
 * Hook manager class that handles registration and execution of hooks
 */
class HookManager {
    private beforeSimplificationHooks: IRegisteredHook<BeforeSimplificationHook>[] = [];
    private beforeMarkdownConversionHooks: IRegisteredHook<BeforeMarkdownConversionHook>[] = [];
    private afterMarkdownConversionHooks: IRegisteredHook<AfterMarkdownConversionHook>[] = [];

    /**
     * Register a hook to run before HTML simplification
     * @param fn - Function to execute
     * @param pattern - Optional regex pattern to match URL against
     */
    registerBeforeSimplification(fn: BeforeSimplificationHook, pattern?: RegExp): void {
        this.beforeSimplificationHooks.push({ fn, pattern });
        logger().debug("Registered beforeSimplification hook", { pattern: pattern?.source });
    }

    /**
     * Register a hook to run before markdown conversion
     * @param fn - Function to execute
     * @param pattern - Optional regex pattern to match URL against
     */
    registerBeforeMarkdownConversion(fn: BeforeMarkdownConversionHook, pattern?: RegExp): void {
        this.beforeMarkdownConversionHooks.push({ fn, pattern });
        logger().debug("Registered beforeMarkdownConversion hook", { pattern: pattern?.source });
    }

    /**
     * Register a hook to run after markdown conversion
     * @param fn - Function to execute
     * @param pattern - Optional regex pattern to match URL against
     */
    registerAfterMarkdownConversion(fn: AfterMarkdownConversionHook, pattern?: RegExp): void {
        this.afterMarkdownConversionHooks.push({ fn, pattern });
        logger().debug("Registered afterMarkdownConversion hook", { pattern: pattern?.source });
    }

    /**
     * Execute all registered beforeSimplification hooks
     * @param doc - Document to process
     * @param url - URL being processed
     * @param article - Article data that can be modified by hooks
     * @returns Object with processed document and merged article
     */
    executeBeforeSimplification(doc: Document, url: string, article: IArticle): { doc: Document; article: IArticle } {
        let resultDoc = doc;
        let resultArticle = article;
        for (const hook of this.beforeSimplificationHooks) {
            if (this.shouldExecute(hook, url)) {
                try {
                    const hookResult = hook.fn(resultDoc, url, resultArticle);
                    if (hookResult.doc) {
                        resultDoc = hookResult.doc;
                    }
                    if (hookResult.metadata) {
                        resultArticle = mergeMetadata(resultArticle, hookResult.metadata);
                    }
                    logger().debug("Executed beforeSimplification hook", { url, pattern: hook.pattern?.source });
                } catch (err) {
                    logger().error("Error executing beforeSimplification hook", { err, url, pattern: hook.pattern?.source });
                }
            }
        }
        return { doc: resultDoc, article: resultArticle };
    }

    /**
     * Execute all registered beforeMarkdownConversion hooks
     * @param html - HTML string to process
     * @param url - URL being processed
     * @param article - Article data that can be modified by hooks
     * @returns Object with processed HTML and merged article
     */
    executeBeforeMarkdownConversion(html: string, url: string, article: IArticle): { html: string; article: IArticle } {
        let resultHtml = html;
        let resultArticle = article;
        for (const hook of this.beforeMarkdownConversionHooks) {
            if (this.shouldExecute(hook, url)) {
                try {
                    const hookResult = hook.fn(resultHtml, url, resultArticle);
                    if (hookResult.html) {
                        resultHtml = hookResult.html;
                    }
                    if (hookResult.metadata) {
                        resultArticle = mergeMetadata(resultArticle, hookResult.metadata);
                    }
                    logger().debug("Executed beforeMarkdownConversion hook", { url, pattern: hook.pattern?.source });
                } catch (err) {
                    logger().error("Error executing beforeMarkdownConversion hook", { err, url, pattern: hook.pattern?.source });
                }
            }
        }
        return { html: resultHtml, article: resultArticle };
    }

    /**
     * Execute all registered afterMarkdownConversion hooks
     * @param markdown - Markdown string to process
     * @param url - URL being processed
     * @param article - Article data that can be modified by hooks
     * @returns Object with processed markdown and merged article
     */
    executeAfterMarkdownConversion(markdown: string, url: string, article: IArticle): { markdown: string; article: IArticle } {
        let resultMarkdown = markdown;
        let resultArticle = article;
        for (const hook of this.afterMarkdownConversionHooks) {
            if (this.shouldExecute(hook, url)) {
                try {
                    const hookResult = hook.fn(resultMarkdown, url, resultArticle);
                    if (hookResult.markdown) {
                        resultMarkdown = hookResult.markdown;
                    }
                    if (hookResult.metadata) {
                        resultArticle = mergeMetadata(resultArticle, hookResult.metadata);
                    }
                    logger().debug("Executed afterMarkdownConversion hook", { url, pattern: hook.pattern?.source });
                } catch (err) {
                    logger().error("Error executing afterMarkdownConversion hook", { err, url, pattern: hook.pattern?.source });
                }
            }
        }
        return { markdown: resultMarkdown, article: resultArticle };
    }

    /**
     * Determine if a hook should execute based on its pattern
     * @param hook - The registered hook
     * @param url - URL being processed
     * @returns true if hook should execute
     */
    private shouldExecute<T>(hook: IRegisteredHook<T>, url: string): boolean {
        if (!hook.pattern) {
            return true; // Universal hooks always execute
        }
        return hook.pattern.test(url);
    }

    /**
     * Clear all registered hooks (primarily for testing)
     */
    clearHooks(): void {
        this.beforeSimplificationHooks = [];
        this.beforeMarkdownConversionHooks = [];
        this.afterMarkdownConversionHooks = [];
        logger().debug("Cleared all hooks");
    }
}

// Export a singleton instance
export const hookManager = new HookManager();
