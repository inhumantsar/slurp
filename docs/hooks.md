# Hooks for Page Processing

Slurp provides a hooks system that allows developers to apply custom transformations at three key points during page processing. This enables fixing common simplification and conversion errors, or applying site-specific processing logic.

## Hook Types

### 1. Before Simplification Hook
Executes before the HTML is simplified by Mozilla Readability. This hook operates on the DOM Document object.

**Use cases:**
- Pre-process raw HTML before readability parsing
- Remove or modify problematic elements that confuse the parser
- Add missing metadata or structure

**Signature:**
```typescript
type BeforeSimplificationHook = (doc: Document, url: string) => Document;
```

### 2. Before Markdown Conversion Hook
Executes after simplification but before the HTML is converted to Markdown. This hook operates on the simplified HTML string.

**Use cases:**
- Clean up HTML structure post-simplification
- Fix formatting issues in the simplified HTML
- Add or remove HTML elements before markdown conversion

**Signature:**
```typescript
type BeforeMarkdownConversionHook = (html: string, url: string) => string;
```

### 3. After Markdown Conversion Hook
Executes after the content has been converted to Markdown. This hook operates on the Markdown string.

**Use cases:**
- Clean up markdown formatting issues
- Apply site-specific markdown transformations
- Add custom markdown elements or formatting

**Signature:**
```typescript
type AfterMarkdownConversionHook = (markdown: string, url: string) => string;
```

## Usage

Import the hook manager and register your hooks:

```typescript
import { hookManager } from 'slurp';
import type { 
    BeforeSimplificationHook, 
    BeforeMarkdownConversionHook, 
    AfterMarkdownConversionHook 
} from 'slurp';
```

### Registering Universal Hooks

Universal hooks execute for all URLs:

```typescript
// Example: Remove all script tags before simplification
hookManager.registerBeforeSimplification((doc, url) => {
    const scripts = doc.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    return doc;
});

// Example: Fix common HTML issues before markdown conversion
hookManager.registerBeforeMarkdownConversion((html, url) => {
    return html.replace(/<br\s*\/?>/gi, '<br/>');
});

// Example: Clean up markdown formatting
hookManager.registerAfterMarkdownConversion((markdown, url) => {
    // Remove excessive blank lines
    return markdown.replace(/\n{3,}/g, '\n\n');
});
```

### Registering Site-Specific Hooks

Site-specific hooks only execute when the URL matches a provided regex pattern:

```typescript
// Example: Medium-specific cleanup
hookManager.registerBeforeMarkdownConversion(
    (html, url) => {
        // Remove Medium's paywall elements
        return html.replace(/<div class="paywall">.*?<\/div>/g, '');
    },
    /medium\.com/
);

// Example: arXiv-specific processing
hookManager.registerAfterMarkdownConversion(
    (markdown, url) => {
        // Add arXiv citation formatting
        const arxivId = url.match(/arxiv\.org\/abs\/(\d+\.\d+)/)?.[1];
        if (arxivId) {
            return `> arXiv: ${arxivId}\n\n${markdown}`;
        }
        return markdown;
    },
    /arxiv\.org/
);

// Example: Multiple site patterns
hookManager.registerAfterMarkdownConversion(
    (markdown, url) => {
        // Common cleanup for news sites
        return markdown.replace(/\[Advertisement\]/g, '');
    },
    /(nytimes\.com|washingtonpost\.com|theguardian\.com)/
);
```

## Hook Execution Order

1. Hooks are executed in the order they are registered
2. Each hook receives the output of the previous hook
3. Universal hooks are evaluated before checking site-specific patterns
4. If a hook throws an error, it is logged but execution continues with remaining hooks

## Example: Complete Hook Setup

```typescript
// hooks.ts - Define your custom hooks
import { hookManager } from 'slurp';

// Universal cleanup
hookManager.registerBeforeSimplification((doc, url) => {
    // Remove common tracking elements
    const tracking = doc.querySelectorAll('[class*="tracking"], [id*="analytics"]');
    tracking.forEach(el => el.remove());
    return doc;
});

// Site-specific: GitHub cleanup
hookManager.registerBeforeMarkdownConversion(
    (html, url) => {
        // Remove GitHub's specific UI elements
        return html
            .replace(/<div class="gh-header-actions">.*?<\/div>/gs, '')
            .replace(/<div class="gh-header-meta">.*?<\/div>/gs, '');
    },
    /github\.com/
);

// Site-specific: Stack Overflow
hookManager.registerAfterMarkdownConversion(
    (markdown, url) => {
        // Format code blocks properly
        return markdown.replace(/```(\w+)\n/g, '```$1\n');
    },
    /stackoverflow\.com/
);
```

## Best Practices

1. **Keep hooks focused**: Each hook should do one thing well
2. **Handle errors gracefully**: Hooks should not throw errors that would break the entire slurp process
3. **Test patterns carefully**: Regex patterns should be specific enough to avoid unintended matches
4. **Document your hooks**: Comment complex transformations for future maintenance
5. **Performance matters**: Hooks are executed on every slurp, so keep them efficient

## Clearing Hooks (Testing)

For testing purposes, you can clear all registered hooks:

```typescript
hookManager.clearHooks();
```

## Future Enhancements

The hooks system is designed to be extensible. Future versions may include:
- Hook priorities for better control over execution order
- Async hook support
- Hook configuration through settings UI
- Pre-built hook libraries for popular sites
