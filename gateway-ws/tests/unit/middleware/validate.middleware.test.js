import { jest, expect, describe, test, beforeEach } from '@jest/globals';

// Mock dependencies before imports
import createLoggerMock from '@meshplaylab/shared/tests/mocks/config/logger.mock.js';
jest.unstable_mockModule('@meshplaylab/shared/src/config/logger.js', () => createLoggerMock());
import validateMock from '../../mocks/utils/validateMessage.mock.js';
jest.unstable_mockModule("../../../src/utils/validateMessage.js", () => validateMock());
import responseMock from '../../mocks/utils/response.mock.js';
jest.unstable_mockModule("../../../src/utils/response.js", () => responseMock());

// Import AFTER mocks
const { default: validateMiddleware } = await import("../../../src/middleware/validate.middleware.js");
const { validateClient } = await import("../../../src/utils/validateMessage.js");
const { errorResponse } = await import("../../../src/utils/response.js");
const { InternalError, AppError } = await import("../../../src/constants/errors.js");



// Test Suite
describe("validate.middleware", () => {
    let socket;
    let loggerMeta;

    beforeEach(() => {
        jest.clearAllMocks();
        socket = { terminate: jest.fn() };
        loggerMeta = { reqId: "123" };
    });

    test("returns true on valid message", () => {
        validateClient.mockReturnValue(true);

        const res = validateMiddleware(socket, { msg: 1 }, false, loggerMeta);
        expect(res).toBe(true);
    });

    test("handles generic error + responds + returns false", () => {
        const err = new Error("Invalid");
        err.code = "VAL_FAIL";

        validateClient.mockImplementation(() => { throw err; });

        const returned = validateMiddleware(socket, {}, false, loggerMeta);

        expect(errorResponse).toHaveBeenCalledWith(
            socket,
            expect.any(String),
            expect.any(InternalError),
            loggerMeta
        );
        expect(socket.terminate).not.toHaveBeenCalled();
        expect(returned).toBe(false);
    });

    test("handles application error + responds + returns false", () => {
        const err = new AppError(40000, "Invalid");

        validateClient.mockImplementation(() => { throw err; });

        const returned = validateMiddleware(socket, {}, false, loggerMeta);

        expect(errorResponse).toHaveBeenCalledWith(
            socket,
            expect.any(String),
            err,
            loggerMeta
        );
        expect(socket.terminate).not.toHaveBeenCalled();
        expect(returned).toBe(false);
    });

    test("closes socket if closeOnFail = true", () => {
        validateClient.mockImplementation(() => { throw new Error("fail"); });

        validateMiddleware(socket, {}, true, loggerMeta);

        expect(socket.terminate).toHaveBeenCalled();
    });
});
