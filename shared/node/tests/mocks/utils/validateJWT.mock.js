import { jest } from '@jest/globals';

export default function validateJWTMock() {
    return {
        validateJWT: jest.fn()
    }
}