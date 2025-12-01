import { jest } from '@jest/globals';

export default function jwtMock() {
    return {
        default: {
            verify: jest.fn()
        }
    }
}