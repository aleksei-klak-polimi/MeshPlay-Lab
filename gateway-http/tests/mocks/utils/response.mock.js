import { jest } from '@jest/globals';

export default function responseMock() {
    return {
        errorResponse: jest.fn()
    }
}