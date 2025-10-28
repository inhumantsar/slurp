# Hooks for Page Processing

Slurp provides a hooks system that allows developers to apply custom transformations at three key points during page processing. Hooks can modify both content and metadata, enabling comprehensive control over the slurping process.

## Hook Types

### 1. Before Simplification Hook
Executes before the HTML is simplified by Mozilla Readability. This hook operates on the DOM Document object and can modify both the document and article metadata.

**Use cases:**
- Pre-process raw HTML before readability parsing
- Remove or modify problematic elements that confuse the parser
- Add missing metadata or structure
- Enrich article metadata from DOM elements

**Signature:**
```typescript
type BeforeSimplificationHook = (
    doc: Document, 
    url: string, 
    article: IArticle
) => IBeforeSimplificationResult;

interface IBeforeSimplificationResult {
    doc?: Document;
    metadata?: IArticleMetadata;
}
```

### 2. Before Markdown Conversion Hook
Executes after simplification but before the HTML is converted to Markdown. This hook operates on the simplified HTML string and can modify both HTML and metadata.

**Use cases:**
- Clean up HTML structure post-simplification
- Fix formatting issues in the simplified HTML
- Add or remove HTML elements before markdown conversion
- Extract additional metadata from simplified HTML

**Signature:**
```typescript
type BeforeMarkdownConversionHook = (
    html: string, 
    url: string, 
    article: IArticle
) => IBeforeMarkdownConversionResult;

interface IBeforeMarkdownConversionResult {
    html?: string;
    metadata?: IArticleMetadata;
}
```

### 3. After Markdown Conversion Hook
Executes after the content has been converted to Markdown. This hook operates on the Markdown string and can modify both markdown and metadata.

**Use cases:**
- Clean up markdown formatting issues
- Apply site-specific markdown transformations
- Add custom markdown elements or formatting
- Final metadata adjustments

**Signature:**
```typescript
type AfterMarkdownConversionHook = (
    markdown: string, 
    url: string, 
    article: IArticle
) => IAfterMarkdownConversionResult;

interface IAfterMarkdownConversionResult {
    markdown?: string;
    metadata?: IArticleMetadata;
}
```

## Usage

Import the hook manager and register your hooks:

```typescript
import { hookManager } from 'slurp';
import type { 
    BeforeSimplificationHook, 
    BeforeMarkdownConversionHook, 
    AfterMarkdownConversionHook,
    IBeforeSimplificationResult,
    IBeforeMarkdownConversionResult,
    IAfterMarkdownConversionResult
} from 'slurp';
```

### Registering Universal Hooks

Universal hooks execute for all URLs:

```typescript
// Example: Remove all script tags before simplification
hookManager.registerBeforeSimplification((doc, url, article) => {
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    return { doc };
});

// Example: Add metadata from DOM elements
hookManager.registerBeforeSimplification((doc, url, article) => {
    const authorElement = doc.querySelector('meta[name="author"]');
    return {
        doc,
        metadata: {
            slurpedTime: new Date(),
            tags: [],
            byline: authorElement?.getAttribute('content') || undefined
        }
    };
});

// Example: Fix common HTML issues before markdown conversion
hookManager.registerBeforeMarkdownConversion((html, url, article) => {
    return { html: html.replace(/<br\s*\/?>/gi, '<br/>') };
});

// Example: Clean up markdown formatting
hookManager.registerAfterMarkdownConversion((markdown, url, article) => {
    // Remove excessive blank lines
    return { markdown: markdown.replace(/\n{3,}/g, '\n\n') };
});
```

### Registering Site-Specific Hooks

Site-specific hooks only execute when the URL matches a provided regex pattern:

```typescript
// Example: Medium-specific cleanup
hookManager.registerBeforeMarkdownConversion(
    (html, url, article) => {
        // Remove Medium's paywall elements
        return { html: html.replace(/<div class="paywall">.*?<\/div>/g, '') };
    },
    /medium\.com/
);

// Example: arXiv-specific processing with metadata
hookManager.registerAfterMarkdownConversion(
    (markdown, url, article) => {
        // Add arXiv citation formatting and extract ID
        const arxivId = url.match(/arxiv\.org\/abs\/(\d+\.\d+)/)?.[1];
        if (arxivId) {
            return {
                markdown: `> arXiv: ${arxivId}\n\n${markdown}`,
                metadata: {
                    slurpedTime: new Date(),
                    tags: [{ tag: 'arxiv', prefix: '' }],
                    type: 'research-paper'
                }
            };
        }
        return { markdown };
    },
    /arxiv\.org/
);

// Example: Multiple site patterns
hookManager.registerAfterMarkdownConversion(
    (markdown, url, article) => {
        // Common cleanup for news sites
        return { markdown: markdown.replace(/\[Advertisement\]/g, '') };
    },
    /(nytimes|washingtonpost|theguardian)\.com/
);
```

## Hook Execution Order and Metadata Merging

1. Hooks are executed in the order they are registered
2. Each hook receives the output of the previous hook
3. **Metadata is automatically merged after each hook execution** using `mergeMetadata`
4. The merged article is passed to the next hook, allowing hooks to build upon each other's metadata changes
5. Universal hooks are evaluated before checking site-specific patterns
6. If a hook throws an error, it is logged but execution continues with remaining hooks

## Example: Complete Hook Setup

```typescript
// hooks.ts - Define your custom hooks
import { hookManager } from 'slurp';

// Universal cleanup
hookManager.registerBeforeSimplification((doc, url, article) => {
    // Remove common tracking elements
    const tracking = doc.querySelectorAll('[class*="tracking"], [id*="analytics"]');
    tracking.forEach(el => el.remove());
    return { doc };
});

// Site-specific: GitHub cleanup with metadata
hookManager.registerBeforeMarkdownConversion(
    (html, url, article) => {
        // Remove GitHub's specific UI elements
        const cleanHtml = html
            .replace(/<div class="gh-header-actions">.*?<\/div>/gs, '')
            .replace(/<div class="gh-header-meta">.*?<\/div>/gs, '');
        
        return {
            html: cleanHtml,
            metadata: {
                slurpedTime: new Date(),
                tags: [{ tag: 'github', prefix: '' }],
                type: 'repository'
            }
        };
    },
    /github\.com/
);

// Site-specific: Stack Overflow
hookManager.registerAfterMarkdownConversion(
    (markdown, url, article) => {
        // Format code blocks properly
        return {
            markdown: markdown.replace(/```(\w+)\n/g, '```$1\n'),
            metadata: {
                slurpedTime: new Date(),
                tags: [{ tag: 'stackoverflow', prefix: '' }],
                type: 'qa'
            }
        };
    },
    /stackoverflow\.com/
);
```

## Best Practices

1. **Keep hooks focused**: Each hook should do one thing well
2. **Return only what you modify**: If not modifying content, return just metadata; if not modifying metadata, return just content
3. **Handle errors gracefully**: Hooks should not throw errors that would break the entire slurp process
4. **Test patterns carefully**: Regex patterns should be specific enough to avoid unintended matches
5. **Document your hooks**: Comment complex transformations for future maintenance
6. **Performance matters**: Hooks are executed on every slurp, so keep them efficient
7. **Leverage metadata merging**: Hooks can build upon metadata set by previous hooks

## Clearing Hooks (Testing)

For testing purposes, you can clear all registered hooks:

```typescript
hookManager.clearHooks();
```

## Future Enhancements

The hooks system is designed to be extensible. Future versions may include:
- Hook priorities (numeric priority values) for explicit control over execution order beyond registration order
- Async hook support
- Hook configuration through settings UI
- Pre-built hook libraries for popular sites

