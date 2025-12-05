import { jest, expect, describe, test, beforeEach, afterAll } from '@jest/globals';

describe("handleClose", () => {
    let handleClose, unregisterSocket, getUserSockets, discnHandler;

    beforeEach(async () => {
        jest.resetModules();

        const { default: createLoggerMock } = await import('@meshplaylab/shared/tests/mocks/config/logger.mock.js');
        jest.unstable_mockModule('@meshplaylab/shared/src/config/logger.js', () => createLoggerMock());
        const { default: sendResponseMock } = await import('../../mocks/server/connectionManager.mock.js');
        jest.unstable_mockModule('../../../src/server/connectionManager.js', () => sendResponseMock());
        jest.unstable_mockModule("../../../src/handlers/disconnection.handler.js", () => ({ default: jest.fn() }));
        jest.unstable_mockModule("../../../src/server/router.js", () => ({ default: jest.fn() }));

        // Re-import fresh module after mocks
        // Import in beforeEach to reset state across tests.
        ({ unregisterSocket, getUserSockets } = await import('../../../src/server/connectionManager.js'));
        ({ default: discnHandler } = await import('../../../src/handlers/disconnection.handler.js'));
        ({ handleClose } = await import("../../../src/server/websocket.js"));
    });

    const mockSocket = (userId = "u1") => ({
        id: "sock123",
        user: { id: userId }
    });



    // Test Suite
    test("handleClose should unregister socket", () => {
        const s = mockSocket("u1");
        getUserSockets.mockReturnValue(new Set());

        handleClose(s);

        expect(unregisterSocket).toHaveBeenCalledWith(s);
    });


    test("handleClose should call discnHandler when user has zero sockets left", () => {
        const s = mockSocket("u1");

        // After unregister: no sockets left
        getUserSockets.mockReturnValue(new Set());

        handleClose(s);

        expect(discnHandler).toHaveBeenCalledWith("u1");
    });


    test("handleClose should NOT call discnHandler if user still has sockets", () => {
        const s = mockSocket("u1");

        getUserSockets.mockReturnValue(new Set([{}]));

        handleClose(s);

        expect(discnHandler).not.toHaveBeenCalled();
    });
});
