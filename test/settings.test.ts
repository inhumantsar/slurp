import { DEFAULT_SETTINGS } from '../src/const';
import type { ISettings } from '../src/types';

describe('Settings', () => {
    it('should have extendShareMenu in DEFAULT_SETTINGS', () => {
        expect(DEFAULT_SETTINGS).toHaveProperty('extendShareMenu');
        expect(typeof DEFAULT_SETTINGS.extendShareMenu).toBe('boolean');
    });

    it('should default extendShareMenu to true', () => {
        expect(DEFAULT_SETTINGS.extendShareMenu).toBe(true);
    });

    it('should have proper settings structure', () => {
        const settings: ISettings = {
            settingsVersion: 1,
            defaultPath: "test",
            fm: {
                includeEmpty: false,
                tags: {
                    parse: false,
                    prefix: '',
                    case: "iKebab-case"
                },
                properties: {}
            },
            logs: { logPath: "test", debug: false },
            extendShareMenu: true
        };

        expect(settings.extendShareMenu).toBe(true);
    });
});
