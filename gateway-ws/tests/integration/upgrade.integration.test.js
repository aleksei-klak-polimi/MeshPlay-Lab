import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { getConnection, pool } from '@meshplaylab/shared/src/config/db.js';
import sign from '@meshplaylab/shared/src/utils/generateJWT';
import http from 'http';
import app from '../../src/app';
import crypto from 'crypto';

// Import utils
import { createTestUser, deleteUser } from './testHelpers/utils';

import setupDB from '@meshplaylab/shared/tests/integration/setup/setupDB.js';
import teardownDB from '@meshplaylab/shared/tests/integration/setup/teardownDB.js';


let port;

beforeAll(async () => {

    //Start with fresh testing db
    await teardownDB(false);
    await setupDB(false);

    port = process.env.PORT;
    app.listen(port);
});

afterAll(async () => {
    app.close();
    await app.closeAsync();
    await pool.end();

    // Delete database to avoid cross test contamination
    await teardownDB(false);
});


// Helper functions
function upgradeRequest(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options);

        req.on("error", reject);

        req.on("response", (res) => {
            // Authentication failed -> server sends HTTP response and closes socket
            resolve({ type: "response", res });
        });

        req.on("upgrade", (res, socket, head) => {
            // Authentication succeeded -> WS connection established
            resolve({ type: "upgrade", res, socket, head });
        });

        req.end();
    });
}



// Test suite
describe('Integration tests for the websocket gateway', () => {

    describe('Tests for upgrade request authentication', () => {

        test('Rejects upgrade request if missing auth header', async () => {
            const key = crypto.randomBytes(16).toString("base64");
            const { type, res } = await upgradeRequest({
                port,
                method: "GET",
                path: "/",
                headers: {
                    Connection: "Upgrade",
                    Upgrade: "websocket",
                    "Sec-WebSocket-Key": key,
                    "Sec-WebSocket-Version": "13",
                }
            });

            expect(type).toBe("response");
            expect(res.statusCode).toBe(401);
        });


        test("Rejects upgrade request if 'Authorization: Bearer' is missing token", async () => {
            const key = crypto.randomBytes(16).toString("base64");
            const { type, res } = await upgradeRequest({
                port,
                method: "GET",
                path: "/",
                headers: {
                    Connection: "Upgrade",
                    Upgrade: "websocket",
                    "Sec-WebSocket-Key": key,
                    "Sec-WebSocket-Version": "13",
                    Authorization: "Bearer ", // no token
                }
            });

            expect(type).toBe("response");
            expect(res.statusCode).toBe(401);
        });


        test("Rejects upgrade request if JWT is of non existing user", async () => {

            const token = sign(99, 'Username');

            const key = crypto.randomBytes(16).toString("base64");
            const { type, res } = await upgradeRequest({
                port,
                method: "GET",
                path: "/",
                headers: {
                    Connection: "Upgrade",
                    Upgrade: "websocket",
                    "Sec-WebSocket-Key": key,
                    "Sec-WebSocket-Version": "13",
                    Authorization: `Bearer ${token}`,
                }
            });

            expect(type).toBe("response");
            expect(res.statusCode).toBe(401);
        });


        test("Rejects upgrade request if JWT is expired", async () => {

            const testUser = {
                id: null,
                username: 'TestUser',
                passHash: 'PassHash',
            }

            testUser.id = await createTestUser(testUser.username, testUser.passHash, getConnection);

            const expiredToken = sign(testUser.id, testUser.username, -10);

            const key = crypto.randomBytes(16).toString("base64");
            const { type, res } = await upgradeRequest({
                port,
                method: "GET",
                path: "/",
                headers: {
                    Connection: "Upgrade",
                    Upgrade: "websocket",
                    "Sec-WebSocket-Key": key,
                    "Sec-WebSocket-Version": "13",
                    Authorization: `Bearer ${expiredToken}`,
                }
            });

            expect(type).toBe("response");
            expect(res.statusCode).toBe(401);

            await deleteUser(testUser.id, getConnection);
        });


        test("Successfully upgrades to WebSocket on valid JWT", async () => {

            const testUser = {
                id: null,
                username: 'TestUser',
                passHash: 'PassHash',
            }

            testUser.id = await createTestUser(testUser.username, testUser.passHash, getConnection);

            const validToken = sign(testUser.id, testUser.username);

            const key = crypto.randomBytes(16).toString("base64");
            const result = await upgradeRequest({
                port,
                method: "GET",
                path: "/",
                headers: {
                    Connection: "Upgrade",
                    Upgrade: "websocket",
                    "Sec-WebSocket-Key": key,
                    "Sec-WebSocket-Version": "13",
                    Authorization: `Bearer ${validToken}`,
                }
            });

            expect(result.type).toBe("upgrade");
            expect(result.socket).toBeDefined();

            result.socket.destroy();

            await deleteUser(testUser.id, getConnection);
        });


    });

});