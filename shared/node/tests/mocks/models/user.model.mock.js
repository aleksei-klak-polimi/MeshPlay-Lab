import { jest } from '@jest/globals';

export default function UserModelMock() {
    return {
        default: {
            create: jest.fn(),
            getById: jest.fn(),
            getByUsername: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        }
    }
}