jest.mock('obsidian', () => ({
    getLanguage: jest.fn(() => 'en'),
    moment: jest.requireActual('moment'),
}));

import * as obsidian from 'obsidian';
import { FRONT_MATTER_ITEM_DEFAULTS, KNOWN_BROKEN_DOMAINS } from '../src/const';
import { FrontMatterProp } from '../src/frontmatter';
import { t, translateText } from '../src/i18n';
import { getErrorMessage } from '../src/lib/util';

const getLanguage = obsidian.getLanguage as jest.MockedFunction<typeof obsidian.getLanguage>;
const obsidianMock = jest.requireMock('obsidian');
const stringContains = Object.getOwnPropertyDescriptor(String.prototype, 'contains');
const arrayContains = Object.getOwnPropertyDescriptor(Array.prototype, 'contains');

beforeAll(() => {
    // Obsidian provides these prototype extensions at runtime.
    Object.defineProperty(String.prototype, 'contains', { configurable: true, value: String.prototype.includes });
    Object.defineProperty(Array.prototype, 'contains', { configurable: true, value: Array.prototype.includes });
});

afterAll(() => {
    if (stringContains) Object.defineProperty(String.prototype, 'contains', stringContains);
    else Reflect.deleteProperty(String.prototype, 'contains');
    if (arrayContains) Object.defineProperty(Array.prototype, 'contains', arrayContains);
    else Reflect.deleteProperty(Array.prototype, 'contains');
});

afterEach(() => {
    getLanguage.mockReturnValue('en');
    obsidian.moment.locale('en');
    delete (globalThis as { localStorage?: Storage }).localStorage;
});

describe('UI language', () => {
    it('follows Obsidian rather than the date locale', () => {
        getLanguage.mockReturnValue('zh-CN');
        obsidian.moment.locale('en');
        expect(t('manageProperties')).toBe('管理属性');

        getLanguage.mockReturnValue('en');
        obsidian.moment.locale('zh-cn');
        expect(t('manageProperties')).toBe('Manage properties');
    });

    it('falls back to the stored UI language on older Obsidian versions', () => {
        const languageApi = obsidian.getLanguage;
        obsidianMock.getLanguage = undefined;
        const getItem = jest.fn(() => 'zh_CN');
        Object.assign(globalThis, { localStorage: { getItem } });
        try {
            expect(t('newProperty')).toBe('新建属性');
            expect(getItem).toHaveBeenCalledWith('language');
        } finally {
            obsidianMock.getLanguage = languageApi;
        }
    });

    it.each(['fr', 'ja', 'en-US'])('keeps English for %s', (language) => {
        getLanguage.mockReturnValue(language);
        expect(t('manageProperties')).toBe('Manage properties');
    });
});

describe('frontmatter display', () => {
    it('preserves property keys, templates, and serialized settings in Chinese', () => {
        getLanguage.mockReturnValue('zh');
        const defaultProp = FRONT_MATTER_ITEM_DEFAULTS.get('twitter')!;
        const prop = new FrontMatterProp({ id: 'twitter', key: 'author_handle' }, defaultProp);
        const saved = prop.getSetting();

        expect(translateText(prop.description!)).toBe('作者或网站的 Twitter/X 链接。');
        expect(t('propertyDefault', { key: prop.defaultKey! })).toBe(' 默认值：twitter');
        for (const token of ['s|', 'd|', '{s}', 'b|true', 'b|false']) {
            expect(t('formatTemplateDesc')).toContain(token);
        }
        expect(prop.key).toBe('author_handle');
        expect(prop.format).toBe('s|https://twitter.com/{s}');
        expect(prop.getSetting()).toEqual(saved);
        expect(translateText('User supplied description')).toBe('User supplied description');
    });

    it('localizes validation without changing format syntax', () => {
        getLanguage.mockReturnValue('zh');
        const prop = new FrontMatterProp({ id: 'test', key: 'test', format: 's|missing' });
        expect(prop.validateFormat()).toEqual(["字符串格式必须至少包含一个替换占位符 '{s}'"]);
        prop.format = 's|{s}';
        expect(prop.validateFormat()).toEqual([]);
        prop.format = 'b|true';
        expect(prop.validateFormat()).toEqual([]);
        prop.format = 'b|false';
        expect(prop.validateFormat()).toEqual([]);
    });
});

describe('error notices', () => {
    it.each([
        ['Unable to fetch page.', '无法抓取网页。'],
        ['No title or content found.', '未找到标题或正文内容。'],
        ['Unable to convert content to Markdown.', '无法将内容转换为 Markdown。'],
    ])('translates %s while retaining the original error', (message, translated) => {
        getLanguage.mockReturnValue('zh-CN');
        const err = new Error(message);
        expect(getErrorMessage(err)).toBe(`${translated}\n原始错误：${message}\n如果这是程序缺陷，请从插件设置中报告。`);
        expect(err.message).toBe(message);
    });

    it('retains a failed request URL and original details verbatim', () => {
        getLanguage.mockReturnValue('zh');
        const message = 'Network request failed: https://example.com/a?query=$&status=403';
        expect(getErrorMessage(new Error(message))).toBe(`此网站需要登录，无法抓取。\n原始错误：${message}`);
        expect(getErrorMessage(new Error('Unexpected upstream error'))).toContain('Unexpected upstream error');
    });

    it('translates the Fast Company reason at display time', () => {
        getLanguage.mockReturnValue('zh');
        const reason = KNOWN_BROKEN_DOMAINS.get('fastcompany.com')!;
        expect(translateText(reason)).toBe('Fast Company 禁止 Slurp 等程序访问其文章。');
        expect(KNOWN_BROKEN_DOMAINS.get('fastcompany.com')).toBe(reason);
    });
});
