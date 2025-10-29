import { convertMathDelimiters } from '../src/parse';

describe('convertMathDelimiters', () => {
    it('should convert inline math delimiters \\(...\\) to $...$', () => {
        const input = 'Some text with \\(h_a \\geq h_c\\) inline math.';
        const expected = 'Some text with $h_a \\geq h_c$ inline math.';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should convert block math delimiters \\[...\\] to $$...$$', () => {
        const input = 'Some text with block math:\\[x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\\]';
        const expected = 'Some text with block math:$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should convert multiple inline math expressions', () => {
        const input = 'First \\(a + b\\) and second \\(c - d\\) math.';
        const expected = 'First $a + b$ and second $c - d$ math.';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should convert multiple block math expressions', () => {
        const input = 'First equation:\\[E = mc^2\\]Second equation:\\[F = ma\\]';
        const expected = 'First equation:$$E = mc^2$$Second equation:$$F = ma$$';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should handle mixed inline and block math', () => {
        const input = 'Inline \\(x\\) and block:\\[y = mx + b\\]and more inline \\(z\\).';
        const expected = 'Inline $x$ and block:$$y = mx + b$$and more inline $z$.';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should handle math with newlines in block math', () => {
        const input = 'Block math:\n\\[\n  x = y + z\n  \\alpha = \\beta\n\\]\nAfter math.';
        const expected = 'Block math:\n$$\n  x = y + z\n  \\alpha = \\beta\n$$\nAfter math.';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should handle math with special LaTeX commands', () => {
        const input = 'Math: \\(\\sum_{i=1}^{n} x_i\\) and \\(\\int_0^\\infty e^{-x} dx\\)';
        const expected = 'Math: $\\sum_{i=1}^{n} x_i$ and $\\int_0^\\infty e^{-x} dx$';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should not modify text without math delimiters', () => {
        const input = 'Regular text without any math expressions.';
        expect(convertMathDelimiters(input)).toEqual(input);
    });

    it('should handle empty string', () => {
        expect(convertMathDelimiters('')).toEqual('');
    });

    it('should handle text with existing dollar sign math', () => {
        const input = 'Already has $x$ and should convert \\(y\\) too.';
        const expected = 'Already has $x$ and should convert $y$ too.';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should handle escaped backslashes correctly', () => {
        const input = 'Math with backslash: \\(\\\\alpha\\) should work.';
        const expected = 'Math with backslash: $\\\\alpha$ should work.';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });

    it('should handle complex nested math expressions', () => {
        const input = 'Complex: \\(\\frac{\\partial f}{\\partial x}\\) and \\[\\lim_{x\\to\\infty} f(x) = L\\]';
        const expected = 'Complex: $\\frac{\\partial f}{\\partial x}$ and $$\\lim_{x\\to\\infty} f(x) = L$$';
        expect(convertMathDelimiters(input)).toEqual(expected);
    });
});
