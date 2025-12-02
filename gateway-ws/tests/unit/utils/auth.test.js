import { jest, expect, describe, test, beforeEach } from '@jest/globals';

// Mock dependencies before imports
import createLoggerMock from '@meshplaylab/shared/tests/mocks/config/logger.mock.js';
jest.unstable_mockModule('@meshplaylab/shared/src/config/logger.js', () => createLoggerMock());
import validateJWTMock from '@meshplaylab/shared/tests/mocks/utils/validateJWT.mock.js';
jest.unstable_mockModule('@meshplaylab/shared/src/utils/validateJWT.js', () => validateJWTMock());

// Import AFTER mocks
const { validateJWT } = await import('@meshplaylab/shared/src/utils/validateJWT.js');
const { default: auth } = await import('../../../src/utils/auth.js');
const { AuthenticationError } = await import('../../../src/constants/errors.js');

// Reset mocks per test
beforeEach(() => {
    jest.clearAllMocks();
});


// Test Suite
describe('auth util function', () => {
    const metadata = { requestId: 'abc123' };

    test('Returns {id, username} when JWT is valid', async () => {
        const decoded = { id: '1', username: 'alice' };
        validateJWT.mockResolvedValue(decoded);

        const result = await auth('valid.jwt', metadata);

        expect(result).toEqual(decoded);
    });

    test('TokenExpiredError throws AuthenticationError', async () => {
        const err = new Error('expired');
        err.name = 'TokenExpiredError';
        validateJWT.mockRejectedValue(err);

        let thrown = null;
        try { await auth('expired.jwt', metadata); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(AuthenticationError);
    });

    test('JsonWebTokenError throws AuthenticationError', async () => {
        const err = new Error('bad token');
        err.name = 'JsonWebTokenError';
        validateJWT.mockRejectedValue(err);

        let thrown = null;
        try { await auth('invalid.jwt', metadata); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(AuthenticationError);
    });

    test('UserNotFound throws AuthenticationError', async () => {
        const err = new Error('user missing');
        err.name = 'UserNotFound';
        validateJWT.mockRejectedValue(err);

        let thrown = null;
        try { await auth('bad.jwt', metadata); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(AuthenticationError);
    });

    test('UsernamesDontMatch throws AuthenticationError', async () => {
        const err = new Error('mismatch');
        err.name = 'UsernamesDontMatch';
        validateJWT.mockRejectedValue(err);

        let thrown = null;
        try { await auth('bad.jwt', metadata); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(AuthenticationError);
    });

    test('InvalidTokenFormat throws AuthenticationError', async () => {
        const err = new Error('format bad');
        err.name = 'InvalidTokenFormat';
        validateJWT.mockRejectedValue(err);

        let thrown = null;
        try { await auth('bad.jwt', metadata); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(AuthenticationError);
    });

    test('Generic error is rethrown', async () => {
        const err = new Error('Unexpected failure!');
        err.name = 'SomeOtherError';
        validateJWT.mockRejectedValue(err);

        let thrown = null;
        try { await auth('weird.jwt', metadata); }
        catch (e) { thrown = e; }

        expect(thrown).toBe(err); // rethrow original
    });

})