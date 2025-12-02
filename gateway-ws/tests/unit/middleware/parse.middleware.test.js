import { jest, expect, describe, test, beforeEach } from '@jest/globals';

// Mock dependencies before imports
import createLoggerMock from '@meshplaylab/shared/tests/mocks/config/logger.mock.js';
jest.unstable_mockModule('@meshplaylab/shared/src/config/logger.js', () => createLoggerMock());
import parseMock from '../../mocks/utils/parseMessage.mock.js';
jest.unstable_mockModule("../../../src/utils/parseMessage.js", () => parseMock());
import responseMock from '../../mocks/utils/response.mock.js';
jest.unstable_mockModule("../../../src/utils/response.js", () => responseMock());

// Import AFTER mocks
const { default: parseMiddleware } = await import("../../../src/middleware/parse.middleware.js");
const { default: parse } = await import("../../../src/utils/parseMessage.js");
const { errorResponse } = await import("../../../src/utils/response.js");
const { InternalError, AppError } = await import("../../../src/constants/errors.js");



// Test Suite
describe("parse.middleware", () => {
    let socket;
    let loggerMeta;

    beforeEach(() => {
        jest.clearAllMocks();
        socket = { terminate: jest.fn() };
        loggerMeta = { reqId: "123" };
    });

    test("returns parsed value on success", () => {
        parse.mockReturnValue({ ok: true });

        const result = parseMiddleware(socket, "rawMessage", false, loggerMeta);

        expect(result).toEqual({ ok: true });
    });

    test("handles generic error appropriately, sends errorResponse, returns false", () => {
        const err = new Error("parse failed");

        parse.mockImplementation(() => { throw err; });

        const returned = parseMiddleware(socket, "rawMsg", false, loggerMeta);

        //expect(sanitizeError).toHaveBeenCalledWith(err, expect.any(String), loggerMeta);
        expect(errorResponse).toHaveBeenCalledWith(
            socket,
            expect.any(String),
            expect.any(InternalError),
            loggerMeta
        );
        expect(socket.terminate).not.toHaveBeenCalled();
        expect(returned).toBe(false);
    });

    test("handles application errors appropriately, sends errorResponse, returns false", () => {
        const err = new AppError(40000, "parse failed");

        parse.mockImplementation(() => { throw err; });

        const returned = parseMiddleware(socket, "rawMsg", false, loggerMeta);

        //expect(sanitizeError).toHaveBeenCalledWith(err, expect.any(String), loggerMeta);
        expect(errorResponse).toHaveBeenCalledWith(
            socket,
            expect.any(String),
            err,
            loggerMeta
        );
        expect(socket.terminate).not.toHaveBeenCalled();
        expect(returned).toBe(false);
    });

    test("closes socket when closeOnFail = true", () => {
        parse.mockImplementation(() => { throw new Error("parse fail"); });

        parseMiddleware(socket, "rawMsg", true, loggerMeta);

        expect(socket.terminate).toHaveBeenCalled();
    });
});
