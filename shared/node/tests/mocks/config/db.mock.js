import { jest } from '@jest/globals';

export default function dbMock(){
    return {
        getConnection: jest.fn()
    }
}