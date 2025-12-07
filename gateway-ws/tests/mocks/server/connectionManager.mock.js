import { jest } from '@jest/globals';

export default function connectionManagerMock() {
    return {
        registerSocket: jest.fn(),
        unregisterSocket: jest.fn(),
        getUserSockets: jest.fn(),
        broadcastToUser: jest.fn()
    }
}