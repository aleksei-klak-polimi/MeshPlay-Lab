import { jest } from '@jest/globals';

export default function sendResponseMock() {
    return {
        errorResponse: jest.fn(),
        successResponse: jest.fn(),
        ackResponse: jest.fn(),
        sendResponse: jest.fn()
    }
}