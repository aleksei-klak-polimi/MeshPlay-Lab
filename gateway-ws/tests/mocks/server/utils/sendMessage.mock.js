import { jest } from '@jest/globals';

export default function sendMessageMock() {
    return {
        default:jest.fn()
    }
}