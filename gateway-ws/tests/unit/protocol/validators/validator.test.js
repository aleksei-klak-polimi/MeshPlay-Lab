import { jest, expect, describe, test, beforeEach } from '@jest/globals';

// Mocks
import createLoggerMock from '@meshplaylab/shared/tests/mocks/config/logger.mock.js';
jest.unstable_mockModule('@meshplaylab/shared/src/config/logger.js', () => createLoggerMock());

// Import after mocks
const { validateClient, validateRedis } = await import('../../../../src/protocol/validators/validator.js');
const { InvalidMessageFormat } = await import('../../../../src/constants/errors.js');

beforeEach(() => {
    jest.clearAllMocks();
});




// validateClient
describe('validator.validateClient', () => {
    const meta = { requestId: 'abc' };

    const baseMessage = {
        target: 'ping',
        payload: { a: 1 },
        metadata: { userReqId: 'client-req-1' }
    };

    test('Returns true for valid client message', () => {
        const msg = structuredClone(baseMessage);

        const result = validateClient(msg, 'server-req-1', meta);

        expect(result).toBe(true);
    });

    test('Missing required field throws InvalidMessageFormat', () => {
        const msg = structuredClone(baseMessage);
        delete msg.target; // missing

        let thrown = null;
        try { validateClient(msg, 'req', meta); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(InvalidMessageFormat);
    });

    test('Wrong field type throws InvalidMessageFormat', () => {
        const msg = structuredClone(baseMessage);
        msg.payload = 'not an object';

        let thrown = null;
        try { validateClient(msg, 'req', meta); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(InvalidMessageFormat);
    });

    test('Missing metadata.userReqId throws InvalidMessageFormat', () => {
        const msg = structuredClone(baseMessage);
        delete msg.metadata.userReqId;

        let thrown = null;
        try { validateClient(msg, 'req', meta); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(InvalidMessageFormat);
    });

    test('metadata.userReqId wrong type throws InvalidMessageFormat', () => {
        const msg = structuredClone(baseMessage);
        msg.metadata.userReqId = 1234;

        let thrown = null;
        try { validateClient(msg, 'req', meta); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(InvalidMessageFormat);
    });
});


// validateRedis
describe('validator.validateRedis', () => {
    const validEvent = {
        userId: '1',
        message: {
            source: 'service',
            type: 'event',
            payload: { foo: 'bar' }
        }
    };

    const validUpdate = {
        userId: '1',
        message: {
            source: 'service',
            type: 'update',
            status: { ok: true },
            metadata: { a: 1 }
        }
    };

    test('Valid "event" redis message returns true', () => {
        const result = validateRedis(validEvent);
        expect(result).toBe(true);
    });

    test('Valid "update" redis message returns true', () => {
        const result = validateRedis(validUpdate);
        expect(result).toBe(true);
    });

    test('Missing required field throws InvalidMessageFormat', () => {
        const msg = structuredClone(validEvent);
        delete msg.message.source;

        let thrown = null;
        try { validateRedis(msg); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(InvalidMessageFormat);
    });

    test('Wrong type throws InvalidMessageFormat', () => {
        const msg = structuredClone(validEvent);
        msg.userId = 123; // should be string

        let thrown = null;
        try { validateRedis(msg); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(InvalidMessageFormat);
    });

    test('Unknown redis message type throws InvalidMessageFormat', () => {
        const msg = {
            userId: '1',
            message: {
                source: 'service',
                type: 'what-is-this',
            }
        };

        let thrown = null;
        try { validateRedis(msg); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(InvalidMessageFormat);
        expect(thrown.message).toContain('Unknown "type"');
    });

    test('"event" type missing payload throws InvalidMessageFormat', () => {
        const msg = {
            userId: '1',
            message: {
                source: 's',
                type: 'event',
                // payload missing
            }
        };

        let thrown = null;
        try { validateRedis(msg); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(InvalidMessageFormat);
    });

    test('"update" type missing status throws InvalidMessageFormat', () => {
        const msg = {
            userId: '1',
            message: {
                source: 's',
                type: 'update',
                // missing status
                metadata: {}
            }
        };

        let thrown = null;
        try { validateRedis(msg); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(InvalidMessageFormat);
    });

    test('"update" type missing metadata throws InvalidMessageFormat', () => {
        const msg = {
            userId: '1',
            message: {
                source: 's',
                type: 'update',
                status: {},
                // missing metadata
            }
        };

        let thrown = null;
        try { validateRedis(msg); }
        catch (e) { thrown = e; }

        expect(thrown).toBeInstanceOf(InvalidMessageFormat);
    });
});
