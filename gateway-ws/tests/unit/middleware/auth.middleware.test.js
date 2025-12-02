import { jest, expect, describe, test, beforeEach } from '@jest/globals';

// Mock dependencies before imports
import createLoggerMock from '@meshplaylab/shared/tests/mocks/config/logger.mock.js';
jest.unstable_mockModule('@meshplaylab/shared/src/config/logger.js', () => createLoggerMock());
import authMock from '../../mocks/utils/auth.mock.js';
jest.unstable_mockModule("../../../src/utils/auth.js", () => authMock());
import responseMock from '../../mocks/utils/response.mock.js';
jest.unstable_mockModule("../../../src/utils/response.js", () => responseMock());

// Import AFTER mocks
const { default: authMiddleware } = await import("../../../src/middleware/auth.middleware.js");
const { default: auth } = await import("../../../src/utils/auth.js");
const { errorResponse, successResponse } = await import("../../../src/utils/response.js");
const { AuthenticationError, InvalidMessageFormat, InternalError, AppError } = await import("../../../src/constants/errors.js");
const { default: codes } = await import("../../../src/protocol/status/codes.js");


// Test Suite
describe("auth.middleware", () => {
    let socket;
    let loggerMeta;
    let baseMessage;

    beforeEach(() => {
        jest.clearAllMocks();

        socket = { terminate: jest.fn() };
        loggerMeta = { reqId: "xyz" };
        baseMessage = {
            target: "auth",
            payload: { token: "jwtString" },
            metadata: { userReqId: "u1" }
        };
    });


    test("rejects when target !== auth", async () => {
        const msg = { ...baseMessage, target: "other" };

        const returned = await authMiddleware(socket, msg, false, loggerMeta);

        expect(errorResponse).toHaveBeenCalledWith(
            socket,
            expect.any(String),
            expect.any(AuthenticationError),
            loggerMeta
        );

        expect(socket.terminate).not.toHaveBeenCalled();
        expect(returned).toBe(false);
    });


    test("rejects missing token field", async () => {
        const msg = { ...baseMessage, payload: {} };

        const returned = await authMiddleware(socket, msg, false, loggerMeta);

        expect(errorResponse).toHaveBeenCalledWith(
            socket,
            expect.any(String),
            expect.any(InvalidMessageFormat),
            loggerMeta
        );

        expect(socket.terminate).not.toHaveBeenCalled();
        expect(returned).toBe(false);
    });


    test("rejects non-string token", async () => {
        const msg = { ...baseMessage, payload: { token: 123 } };

        const returned = await authMiddleware(socket, msg, false, loggerMeta);

        expect(errorResponse).toHaveBeenCalledWith(
            socket,
            expect.any(String),
            expect.any(InvalidMessageFormat),
            loggerMeta
        );

        expect(socket.terminate).not.toHaveBeenCalled();
        expect(returned).toBe(false);
    });


    test("handles auth application errors", async () => {
        const err = new AppError("bad token");

        auth.mockImplementation(() => { throw err; });

        const returned = await authMiddleware(socket, baseMessage, false, loggerMeta);

        expect(errorResponse).toHaveBeenCalledWith(
            socket,
            "auth",
            err,
            loggerMeta
        );

        expect(socket.terminate).not.toHaveBeenCalled();
        expect(returned).toBe(false);
    });


    test("handles generic errors", async () => {
        const err = new Error("bad token");
        auth.mockImplementation(() => { throw err; });

        const returned = await authMiddleware(socket, baseMessage, false, loggerMeta);

        expect(errorResponse).toHaveBeenCalledWith(
            socket,
            "auth",
            expect.any(InternalError),
            loggerMeta
        );

        expect(socket.terminate).not.toHaveBeenCalled();
        expect(returned).toBe(false);
    });


    test("terminates connection when closeOnFail = true", async () => {
        const err = new Error("bad token");
        auth.mockImplementation(() => { throw err; });

        await authMiddleware(socket, baseMessage, true, loggerMeta);

        expect(socket.terminate).toHaveBeenCalled();
    });


    test("successful authentication calls successResponse + returns true", async () => {
        auth.mockImplementation(() => { return { id: "user1" }; });

        const result = await authMiddleware(socket, baseMessage, true, loggerMeta);

        expect(socket.user).toEqual({ id: "user1" });

        expect(successResponse).toHaveBeenCalledWith(
            socket,
            "auth",
            codes.AUTH_SUCCESS,
            expect.any(String),
            loggerMeta,
            baseMessage.metadata
        );

        expect(socket.terminate).not.toHaveBeenCalled();
        expect(result).toBe(true);
    });
});
