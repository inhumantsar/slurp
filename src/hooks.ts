import { logger } from "./lib/logger";

/**
 * Hook function type for before simplification (operates on Document)
 */
export type BeforeSimplificationHook = (doc: Document, url: string) => Document;

/**
 * Hook function type for before markdown conversion (operates on HTML string)
 */
export type BeforeMarkdownConversionHook = (html: string, url: string) => string;

/**
 * Hook function type for after markdown conversion (operates on markdown string)
 */
export type AfterMarkdownConversionHook = (markdown: string, url: string) => string;

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
     * @returns Processed document
     */
    executeBeforeSimplification(doc: Document, url: string): Document {
        let result = doc;
        for (const hook of this.beforeSimplificationHooks) {
            if (this.shouldExecute(hook, url)) {
                try {
                    result = hook.fn(result, url);
                    logger().debug("Executed beforeSimplification hook", { url, pattern: hook.pattern?.source });
                } catch (err) {
                    logger().error("Error executing beforeSimplification hook", { err, url, pattern: hook.pattern?.source });
                }
            }
        }
        return result;
    }

    /**
     * Execute all registered beforeMarkdownConversion hooks
     * @param html - HTML string to process
     * @param url - URL being processed
     * @returns Processed HTML string
     */
    executeBeforeMarkdownConversion(html: string, url: string): string {
        let result = html;
        for (const hook of this.beforeMarkdownConversionHooks) {
            if (this.shouldExecute(hook, url)) {
                try {
                    result = hook.fn(result, url);
                    logger().debug("Executed beforeMarkdownConversion hook", { url, pattern: hook.pattern?.source });
                } catch (err) {
                    logger().error("Error executing beforeMarkdownConversion hook", { err, url, pattern: hook.pattern?.source });
                }
            }
        }
        return result;
    }

    /**
     * Execute all registered afterMarkdownConversion hooks
     * @param markdown - Markdown string to process
     * @param url - URL being processed
     * @returns Processed markdown string
     */
    executeAfterMarkdownConversion(markdown: string, url: string): string {
        let result = markdown;
        for (const hook of this.afterMarkdownConversionHooks) {
            if (this.shouldExecute(hook, url)) {
                try {
                    result = hook.fn(result, url);
                    logger().debug("Executed afterMarkdownConversion hook", { url, pattern: hook.pattern?.source });
                } catch (err) {
                    logger().error("Error executing afterMarkdownConversion hook", { err, url, pattern: hook.pattern?.source });
                }
            }
        }
        return result;
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
