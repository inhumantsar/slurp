jest.mock('obsidian', () => ({ moment: jest.requireActual('moment') }));
jest.mock('../src/const', () => ({ FRONT_MATTER_ITEM_DEFAULTS: new Map() }));
jest.mock('../src/lib/logger', () => ({ logger: () => ({ debug: jest.fn() }) }));

import { getFrontMatterYaml } from '../src/frontmatter';
import { formatDate } from '../src/lib/formatters';

describe('frontmatter formatting', () => {
    it('preserves representative date formats', () => {
        const date = new Date(2024, 0, 2, 3, 4, 5);

        expect(formatDate('YYYY-MM-DD', date)).toBe('2024-01-02');
        expect(formatDate('YYYYMMDD', date)).toBe(20240102);
        expect(formatDate('MMMM dddd', date)).toBe('January Tuesday');
    });

    it('preserves YAML output for empty and special scalar values', () => {
        const values = new Map<string, unknown>([
            ['title', 'A: title'],
            ['empty', null],
            ['enabled', true],
            ['tags', ['one', 'two']],
            ['multiline', 'first\nsecond'],
            ['unicode', 'café'],
        ]);
        const order = new Map(Array.from(values.keys()).map((key, index) => [key, index]));

        expect(getFrontMatterYaml(values, order)).toBe(
            'title: "A: title"\n' +
            'empty:\n' +
            'enabled: true\n' +
            'tags:\n' +
            '  - one\n' +
            '  - two\n' +
            'multiline: |-\n' +
            '  first\n' +
            '  second\n' +
            'unicode: café',
        );
    });
});
