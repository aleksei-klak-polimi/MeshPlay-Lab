import { jest } from '@jest/globals';

export default function authMock() {
    return {
        default: jest.fn()
    }
}