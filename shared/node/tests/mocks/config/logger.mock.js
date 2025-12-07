import { jest } from '@jest/globals';

export default function createLoggerMock() {
    return {
        createLogger() {
            return {
                setMetadata: jest.fn(),
                debug: jest.fn(),
                info: jest.fn(),
                warn: jest.fn(),
                error: jest.fn(),
            };
        }
    }
}
