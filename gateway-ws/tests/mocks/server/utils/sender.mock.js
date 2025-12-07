import { jest } from '@jest/globals';

export default function senderMock() {
    return {
        default:jest.fn()
    }
}