import { jest, expect, describe, test, beforeEach } from '@jest/globals';

// Mock dependencies before imports
import createLoggerMock from '@meshplaylab/shared/tests/mocks/config/logger.mock.js';
jest.unstable_mockModule('@meshplaylab/shared/src/config/logger.js', () => createLoggerMock());
import validateJWTMock from '@meshplaylab/shared/tests/mocks/utils/validateJWT.mock.js';
jest.unstable_mockModule('@meshplaylab/shared/src/utils/validateJWT.js', () => validateJWTMock());
import responseMock from '../../mocks/utils/response.mock.js';
jest.unstable_mockModule("../../../src/utils/response.js", () => responseMock());

// Import AFTER mocks
const { default: authMiddleware } = await import("../../../src/middleware/auth.middleware.js");
const { validateJWT } = await import('@meshplaylab/shared/src/utils/validateJWT.js');


// Test Suite
describe("auth.middleware (HTTP Upgrade Authentication)", () => {
    let req, socket, head, wss;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            headers: {},
        };

        socket = {
            write: jest.fn(),
            destroy: jest.fn(),
            remoteAddress: "127.0.0.1"
        };

        head = Buffer.from("test");
        wss = {
            handleUpgrade: jest.fn((req, socket, head, cb) => cb({})),
            emit: jest.fn()
        };

    });


    test("rejects request if Authorization header is missing", async () => {
        req.headers = {}; // no Authorization

        await authMiddleware(req, socket, head, wss);

        expect(socket.write).toHaveBeenCalledWith(
            expect.stringContaining("401")
        );
        expect(socket.destroy).toHaveBeenCalled();
        expect(wss.handleUpgrade).not.toHaveBeenCalled();
    });


    test("rejects request if JWT token is missing in Authorization header", async () => {
        req.headers["authorization"] = "Bearer";

        await authMiddleware(req, socket, head, wss);

        expect(socket.write).toHaveBeenCalledWith(
            expect.stringContaining("401")
        );
        expect(socket.destroy).toHaveBeenCalled();
        expect(wss.handleUpgrade).not.toHaveBeenCalled();
    });


    test("rejects expired JWT", async () => {
        req.headers["authorization"] = "Bearer token123";
        const err = new Error("expired");
        err.name = "TokenExpiredError";

        validateJWT.mockImplementation(() => { throw err; });

        await authMiddleware(req, socket, head, wss);

        expect(socket.write).toHaveBeenCalledWith(
            expect.stringContaining("401")
        );
        expect(socket.destroy).toHaveBeenCalled();
        expect(wss.handleUpgrade).not.toHaveBeenCalled();
    });


    test("rejects invalid JWT", async () => {
        req.headers["authorization"] = "Bearer token123";
        const err = new Error("expired");
        err.name = "JsonWebTokenError";

        validateJWT.mockImplementation(() => { throw err; });

        await authMiddleware(req, socket, head, wss);

        expect(socket.write).toHaveBeenCalledWith(
            expect.stringContaining("401")
        );
        expect(socket.destroy).toHaveBeenCalled();
        expect(wss.handleUpgrade).not.toHaveBeenCalled();
    });


    test("rejects invalid token format", async () => {
        req.headers["authorization"] = "Bearer token123";
        const err = new Error("expired");
        err.name = "InvalidTokenFormat";

        validateJWT.mockImplementation(() => { throw err; });

        await authMiddleware(req, socket, head, wss);

        expect(socket.write).toHaveBeenCalledWith(
            expect.stringContaining("401")
        );
        expect(socket.destroy).toHaveBeenCalled();
        expect(wss.handleUpgrade).not.toHaveBeenCalled();
    });


    test("rejects token for non-existing user", async () => {
        req.headers["authorization"] = "Bearer token123";
        const err = new Error("expired");
        err.name = "UserNotFound";

        validateJWT.mockImplementation(() => { throw err; });

        await authMiddleware(req, socket, head, wss);

        expect(socket.write).toHaveBeenCalledWith(
            expect.stringContaining("401")
        );
        expect(socket.destroy).toHaveBeenCalled();
        expect(wss.handleUpgrade).not.toHaveBeenCalled();
    });


    test("rejects token with mismatched username", async () => {
        req.headers["authorization"] = "Bearer token123";
        const err = new Error("expired");
        err.name = "UsernamesDontMatch";

        validateJWT.mockImplementation(() => { throw err; });

        await authMiddleware(req, socket, head, wss);

        expect(socket.write).toHaveBeenCalledWith(
            expect.stringContaining("401")
        );
        expect(socket.destroy).toHaveBeenCalled();
        expect(wss.handleUpgrade).not.toHaveBeenCalled();
    });


    test("handles unexpected internal errors", async () => {
        req.headers["authorization"] = "Bearer token123";
        const err = new Error("expired");
        err.name = "SomethingElse";

        validateJWT.mockImplementation(() => { throw err; });

        await authMiddleware(req, socket, head, wss);

        expect(socket.write).toHaveBeenCalledWith(
            expect.stringContaining("500")
        );
        expect(socket.destroy).toHaveBeenCalled();
        expect(wss.handleUpgrade).not.toHaveBeenCalled();
    });


    test("successful JWT auth upgrades WebSocket connection", async () => {
        req.headers["authorization"] = "Bearer validToken";

        const decoded = { id: "123", username: "alice" };
        validateJWT.mockImplementation( () => {return decoded;});

        await authMiddleware(req, socket, head, wss);

        // Upgrade should happen
        expect(wss.handleUpgrade).toHaveBeenCalled();

        // The callback inside handleUpgrade should set ws.user
        const wsObj = wss.handleUpgrade.mock.calls[0][3];
        expect(typeof wsObj).toBe("function");

        // Run callback manually
        let ws = {};
        wsObj(ws);
        expect(ws.user).toEqual(decoded);

        // And emit "connection"
        expect(wss.emit).toHaveBeenCalledWith("connection", ws, req);

        // No socket.destroy
        expect(socket.destroy).not.toHaveBeenCalled();
    });
});
