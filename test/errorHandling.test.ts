import { getErrorMessage } from '../src/lib/util';

describe('getErrorMessage', () => {
    describe('authentication errors', () => {
        it('should return login required message for 401 errors', () => {
            const err = new Error('Request failed, status 401');
            const result = getErrorMessage(err);
            expect(result).toBe("This site cannot be slurped as it requires a login.");
        });

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
    });

    describe('URL/request errors', () => {
        it('should return invalid request message for 400 errors', () => {
            const err = new Error('Request failed, status 400');
            const result = getErrorMessage(err);
            expect(result).toBe("Invalid request. Please check the URL and try again.");
        });

        it('should return not found message for 404 errors', () => {
            const err = new Error('Request failed, status 404');
            const result = getErrorMessage(err);
            expect(result).toBe("Page not found. Please check the URL and try again.");
        });
    });

    describe('rate limiting errors', () => {
        it('should return rate limit message for 429 errors', () => {
            const err = new Error('Request failed, status 429');
            const result = getErrorMessage(err);
            expect(result).toBe("Too many requests. Please wait a moment and try again.");
        });
    });

    describe('server errors', () => {
        it('should return server error message for 500 errors', () => {
            const err = new Error('Request failed, status 500');
            const result = getErrorMessage(err);
            expect(result).toBe("The server encountered an error. Please try again later.");
        });

        it('should return server error message for 502 errors', () => {
            const err = new Error('Request failed, status 502');
            const result = getErrorMessage(err);
            expect(result).toBe("The server encountered an error. Please try again later.");
        });

        it('should return server error message for 503 errors', () => {
            const err = new Error('Request failed, status 503');
            const result = getErrorMessage(err);
            expect(result).toBe("The server encountered an error. Please try again later.");
        });

        it('should return server error message for 504 errors', () => {
            const err = new Error('Request failed, status 504');
            const result = getErrorMessage(err);
            expect(result).toBe("The server encountered an error. Please try again later.");
        });

        it('should return server error message for 408 timeout errors', () => {
            const err = new Error('Request failed, status 408');
            const result = getErrorMessage(err);
            expect(result).toBe("The server encountered an error. Please try again later.");
        });
    });

    describe('network errors', () => {
        it('should return network error message for network failures', () => {
            const err = new Error('Network request failed');
            const result = getErrorMessage(err);
            expect(result).toBe("A network error occurred. Please check your connection and try again.");
        });

        it('should return network error message for timeout errors', () => {
            const err = new Error('Request timeout');
            const result = getErrorMessage(err);
            expect(result).toBe("A network error occurred. Please check your connection and try again.");
        });

        it('should return network error message for connection errors', () => {
            const err = new Error('Connection refused');
            const result = getErrorMessage(err);
            expect(result).toBe("A network error occurred. Please check your connection and try again.");
        });
    });

    describe('unknown errors', () => {
        it('should return default message with bug report text for unknown errors', () => {
            const err = new Error('Something unexpected happened');
            const result = getErrorMessage(err);
            expect(result).toBe("Something unexpected happened. If this is a bug, please report it from plugin settings.");
        });

        it('should handle error without message property', () => {
            const err = {} as Error;
            const result = getErrorMessage(err);
            expect(result).toBe("[object Object]. If this is a bug, please report it from plugin settings.");
        });

        it.each([
            'Cowardly refusing to increment past 100.',
            'Unable to fetch page.',
            'No title or content found.',
            'Unable to convert content to Markdown.',
        ])('preserves the notice text for %s', (message) => {
            expect(`Slurp Error! ${getErrorMessage(new Error(message))}`).toBe(
                `Slurp Error! ${message}. If this is a bug, please report it from plugin settings.`,
            );
        });
    });
});
