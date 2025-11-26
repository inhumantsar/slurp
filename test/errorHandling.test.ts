import { getErrorMessage } from '../src/lib/util';

describe('getErrorMessage', () => {
    it('should return login required message for 403 errors', () => {
        const err = new Error('Request failed, status 403');
        const result = getErrorMessage(err);
        expect(result).toBe("This site cannot be slurped as it requires a login.");
    });

    it('should return login required message when error message contains "403"', () => {
        const err = new Error('failed: 403');
        const result = getErrorMessage(err);
        expect(result).toBe("This site cannot be slurped as it requires a login.");
    });

    it('should return default message with bug report text for other errors', () => {
        const err = new Error('Network timeout');
        const result = getErrorMessage(err);
        expect(result).toBe("Network timeout. If this is a bug, please report it from plugin settings.");
    });

    it('should return default message for 404 errors', () => {
        const err = new Error('Request failed, status 404');
        const result = getErrorMessage(err);
        expect(result).toBe("Request failed, status 404. If this is a bug, please report it from plugin settings.");
    });

    it('should handle error without message property', () => {
        const err = {} as Error;
        const result = getErrorMessage(err);
        expect(result).toBe("[object Object]. If this is a bug, please report it from plugin settings.");
    });
});
