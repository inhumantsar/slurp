import { convertMathDelimiters } from '../src/parse';

describe('convertMathDelimiters', () => {
    it('should convert inline math delimiters \\( ... \\) to $...$', () => {
        const input = 'Some text with \\(h_a \\geq h_c\\) inline math.';
        const expected = 'Some text with $h_a \\geq h_c$ inline math.';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should convert block math delimiters at line boundaries', () => {
        const input = 'Before math\n\\[x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\]\nAfter math';
        const expected = 'Before math\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\nAfter math';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should ignore inline block delimiters', () => {
        const input = 'Inline \\[x = y\\] should stay the same.';
        expect(convertMathDelimiters(input)).toEqual(input);
    });

    it('should handle mixed inline and block math', () => {
        const input = 'Inline \\(x\\) and block:\n\\[y = mx + b\\]\nMore inline \\(z\\).';
        const expected = 'Inline $x$ and block:\n$$y = mx + b$$\nMore inline $z$.';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should handle math with newlines in block math', () => {
        const input = 'Block math:\n\\[\n  x = y + z\n  \\alpha = \\beta\n\\]\nAfter math.';
        const expected = 'Block math:\n$$\n  x = y + z\n  \\alpha = \\beta\n$$\nAfter math.';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should ignore inline code spans', () => {
        const input = 'Use `\\(x\\)` in code and \\(y\\) in text.';
        const expected = 'Use `\\(x\\)` in code and $y$ in text.';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should ignore fenced code blocks', () => {
        const input = '```\n\\(x\\)\n\\[y\\]\n```\nOutside \\(z\\).';
        const expected = '```\n\\(x\\)\n\\[y\\]\n```\nOutside $z$.';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should not modify text without math delimiters', () => {
        const input = 'Regular text without any math expressions.';
        expect(convertMathDelimiters(input)).toEqual(input);
    });
});
