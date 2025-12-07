import { jest } from '@jest/globals';

export default function validateMock() {
    return {
        validateClient: jest.fn(),
        validateRedis: jest.fn(),
    }
}