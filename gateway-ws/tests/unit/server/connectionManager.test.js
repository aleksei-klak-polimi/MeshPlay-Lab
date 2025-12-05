import { jest, expect, describe, test, beforeEach } from '@jest/globals';

describe('connectionManager', () => {
    let registerSocket, unregisterSocket, getUserSockets, broadcastToUser, sendMessage;

    beforeEach(async () => {
        //Needed to reset the internal state of connectionManager.js
        jest.resetModules();

        // Mock dependencies here because of jest.resetModules();
        const { default: createLoggerMock } = await import('@meshplaylab/shared/tests/mocks/config/logger.mock.js');
        jest.unstable_mockModule('@meshplaylab/shared/src/config/logger.js', () => createLoggerMock());
        const { default: sendMessageMock } = await import('../../mocks/utils/sendMessage.mock.js');
        jest.unstable_mockModule('../../../src/utils/sendMessage.js', () => sendMessageMock());
        
        // Re-import fresh module after mocks
        // Import in beforeEach to reset state across tests.
        ({ default: sendMessage } = await import('../../../src/utils/sendMessage.js'));
        ({ registerSocket, unregisterSocket, getUserSockets, broadcastToUser } = await import('../../../src/server/connectionManager.js'));
    });

    const mockSocket = (userId = 'u1') => ({
        user: { id: userId }
    });



    // Test Suite
    test('registerSocket should register socket for a user', () => {
        const s1 = mockSocket('u1');
        const s2 = mockSocket('u1');

        registerSocket(s1);
        registerSocket(s2);

        const sockets = getUserSockets('u1');
        expect(sockets.size).toBe(2);
        expect(sockets.has(s1)).toBe(true);
        expect(sockets.has(s2)).toBe(true);
    });


    test('unregisterSocket should remove socket but not user if others remain', () => {
        const s1 = mockSocket('u1');
        const s2 = mockSocket('u1');

        registerSocket(s1);
        registerSocket(s2);

        unregisterSocket(s1);

        const sockets = getUserSockets('u1');
        expect(sockets.size).toBe(1);
        expect(sockets.has(s2)).toBe(true);
    });


    test('unregisterSocket should delete user entry when last socket removed', () => {
        const s1 = mockSocket('u1');

        registerSocket(s1);
        unregisterSocket(s1);

        const sockets = getUserSockets('u1');
        expect(sockets.size).toBe(0); // returns empty Set
    });


    test('getUserSockets should return empty Set for unknown user', () => {
        expect(getUserSockets('unknown')).toBeInstanceOf(Set);
        expect(getUserSockets('unknown').size).toBe(0);
    });


    test('broadcastToUser should send message to all sockets of the user', () => {
        const s1 = mockSocket('u1');
        const s2 = mockSocket('u1');

        registerSocket(s1);
        registerSocket(s2);

        const message = { abc: 123 };

        broadcastToUser('u1', message);

        expect(sendMessage).toHaveBeenCalledTimes(2);
        expect(sendMessage).toHaveBeenCalledWith(s1, message);
        expect(sendMessage).toHaveBeenCalledWith(s2, message);

    });
});
