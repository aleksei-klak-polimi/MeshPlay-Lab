import { jest } from '@jest/globals';
import { errorResponse } from '../../../src/utils/response';

export default function responseMock() {
    return {
        errorResponse: jest.fn(),
        successResponse: jest.fn(),
        ackResponse: jest.fn(),
        eventResponse: jest.fn(),
        updateResponse: jest.fn(),
    }
}