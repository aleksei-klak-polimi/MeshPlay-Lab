import { jest } from '@jest/globals';

export default function errorHandMock() {
    return {
        handleError: jest.fn(() => {return {status: 500}})
    }
}