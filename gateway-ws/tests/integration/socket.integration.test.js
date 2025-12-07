import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { getConnection, pool } from '@meshplaylab/shared/src/config/db.js';
import UserModel from '@meshplaylab/shared/src/models/user.model';
import sign from '@meshplaylab/shared/src/utils/generateJWT';
import WebSocket from 'ws';
import app from '../../src/app';

import Ajv from 'ajv';
import serverReadySchema from './schemas/ServerReady.json';
import invalidInputSchema from './schemas/InvalidInput.json';
import invalidTargetSchema from './schemas/InvalidTarget.json';
import receivedSchema from './schemas/Received.json';

import setupDB from '@meshplaylab/shared/tests/integration/setup/setupDB.js';
import teardownDB from '@meshplaylab/shared/tests/integration/setup/teardownDB.js';

const SOCKET_WAIT = 500;
let port, token, userId;
const baseSocketUrl = 'ws://localhost';

beforeAll(async () => {

    // Start with fresh testing db
    await teardownDB(false);
    await setupDB(false);

    // Create a test user and JWT
    userId = await createTestUser('TestUser', 'TestPassHash');
    token = sign(userId, 'TestUser');

    port = process.env.PORT;
    await new Promise(res => app.listen(port, res));
});

afterAll(async () => {
    app.close();
    await app.closeAsync();

    await pool.end();

    // Delete database to avoid cross test contamination
    await teardownDB(false);
});


// Helper functions
function validateResponse(response, schema) {
    const ajv = new Ajv();
    const validate = ajv.compile(schema);

    const valid = validate(response);
    if (!valid) {
        console.error(`Received: ${JSON.stringify(response)}`);
        console.error(validate.errors);
    }

    expect(valid).toBe(true);
}

async function createTestUser(username, password) {
    let connection;
    try {
        connection = await getConnection();
        const id = await UserModel.create(connection, { username, passwordHash: password, createdAt: new Date() });
        return id;
    } finally {
        if (connection) connection.release();
    }
}

function newSocket(customToken = null) {
    if (customToken)
        return new WebSocket(`${baseSocketUrl}:${port}`, { headers: { Authorization: `Bearer ${customToken}` } });

    return new WebSocket(`${baseSocketUrl}:${port}`, { headers: { Authorization: `Bearer ${token}` } });
}

async function getResponses(ws, message = null, responsesAmount) {
    const responses = [];

    return new Promise((resolve, reject) => {
        let timer;
        ws.on('open', () => {
            timer = setTimeout(() => reject(new Error("No WS message received")), SOCKET_WAIT);
            if (message)
                ws.send(message);
        });
        ws.on("error", reject);
        ws.on("message", msg => {
            responses.push(JSON.parse(msg.toString()));
            if (responses.length >= responsesAmount) {
                clearTimeout(timer);
                resolve(responses);
            }
        });
    });
}

function newRequest() {
    return {
        target: null,
        payload: {},
        metadata: {
            userReqId: "xyz789"
        }
    }
}


// Test suite

describe('Tests for message handling Between the Client and the WSS on sockets', () => {


    test('First message from Server is ServerReady', async () => {
        const ws = newSocket();
        const responses = await getResponses(ws, null, 1);

        validateResponse(responses[0], serverReadySchema);
        ws.close();
    });


    test('Server responds correctly to malformed request JSON', async () => {
        const ws = newSocket();
        const malformed = '{"target":"chat",}';
        const responses = await getResponses(ws, malformed, 2);

        validateResponse(responses[1], invalidInputSchema);
        ws.close();
    });


    test('Server responds correctly to missing request fields', async () => {
        const ws = newSocket();
        const malformed = '{"target": "chat", "metadata": {}}';
        const responses = await getResponses(ws, malformed, 2);

        validateResponse(responses[1], invalidInputSchema);
        ws.close();
    });


    test('Server responds correctly to invalid message target', async () => {
        const ws = newSocket();
        const malformed = newRequest();
        malformed.target = 'blob';
        const string = JSON.stringify(malformed);
        const responses = await getResponses(ws, string, 2);

        validateResponse(responses[1], invalidTargetSchema);
        ws.close();
    });

    test('Server responds with ack to valid message.', async () => {
        const ws = newSocket();
        const message = newRequest();
        message.target = 'chat';
        const string = JSON.stringify(message);
        const responses = await getResponses(ws, string, 2);

        validateResponse(responses[1], receivedSchema);
        ws.close();
    });
});