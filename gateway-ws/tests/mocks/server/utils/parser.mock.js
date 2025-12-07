import { jest } from '@jest/globals';

export default function parseMock() {
    return {
        default: jest.fn()
    }
}