jest.mock('obsidian', () => ({
    MarkdownView: class {},
    Menu: class {},
    MenuItem: class {},
    Notice: class {},
    Plugin: class {},
}));
jest.mock('../src/const', () => ({
    DEFAULT_SETTINGS: {
        settingsVersion: 1,
        defaultPath: '',
        frontmatterOnly: false,
        fm: { includeEmpty: false, tags: { parse: true, prefix: '', case: 'iKebab-case' }, properties: {} },
        logs: { debug: true, logPath: 'slurp-logs' },
    },
}));
jest.mock('../src/frontmatter', () => ({
    createFrontMatter: jest.fn(),
    createFrontMatterPropSettings: jest.fn(),
    createFrontMatterProps: jest.fn(),
}));
jest.mock('../src/lib/files', () => ({ getNewFilePath: jest.fn() }));
jest.mock('../src/lib/logger', () => ({ Logger: class {} }));
jest.mock('../src/modals/new-note', () => ({ SlurpNewNoteModal: class {} }));
jest.mock('../src/parse', () => ({
    fetchHtml: jest.fn(),
    mergeMetadata: jest.fn(),
    parseMarkdown: jest.fn(),
    parseMetadata: jest.fn(),
    parsePage: jest.fn(),
}));
jest.mock('../src/settings', () => ({ SlurpSettingsTab: class {} }));
jest.mock('../main.js', () => jest.requireActual('../main.ts'));

import SlurpPlugin from '../main';
import type { ISettingsV0 } from '../src/types';

describe('settings migration', () => {
    it('preserves v0 values while adding v1 log defaults', () => {
        const settings: ISettingsV0 = {
            showEmptyProps: true,
            parseTags: false,
            tagPrefix: 'captured/',
            tagCase: 'snake_case',
            propSettings: {
                title: { id: 'title', enabled: true, custom: false },
            },
            debug: false,
        };
        const plugin = Object.create(SlurpPlugin.prototype) as SlurpPlugin;

        expect(plugin.migrateSettingsV0toV1(settings)).toEqual({
            settingsVersion: 1,
            fm: {
                includeEmpty: true,
                tags: { parse: false, prefix: 'captured', case: 'snake_case' },
                properties: settings.propSettings,
            },
            logs: { debug: true, logPath: 'slurp-logs' },
        });
    });
});
