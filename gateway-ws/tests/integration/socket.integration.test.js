import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { redisPub, redisSub } from '../../src/config/redis';
import { getConnection, pool } from '@meshplaylab/shared/src/config/db.js';
import UserModel from '@meshplaylab/shared/src/models/user.model';
import sign from '@meshplaylab/shared/src/utils/generateJWT';
import Redis from "ioredis";
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
    app.listen(port);
});

afterAll(async () => {
    app.close();
    await app.closeAsync();

    await pool.end();

    await redisPub.quit();
    await redisSub.quit();

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

async function deleteUser(userId) {
    let connection;
    try {
        connection = await getConnection();
        await UserModel.delete(connection, userId);
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
describe('Integration tests for the websocket gateway', () => {

    describe('Tests for message handling Client -> Server', () => {

    });

    describe('Tests for message handling Server -> Client', () => {


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


        test('Server propagates message to redis pubsub.', async () => {
            const ws = newSocket();
            const message = newRequest();
            message.target = 'chat';
            message.payload = { text: 'Hello World!' };


            const messages = [];
            const redisListener = new Redis(process.env.REDIS_URL);
            await redisListener.subscribe('test.chat.incoming');

            await new Promise((resolve, reject) => {
                redisListener.on('message', (channel, message) => {
                    clearTimeout(timer);
                    messages.push(JSON.parse(message));
                    resolve();
                });

                ws.on('open', () => {
                    ws.send(JSON.stringify(message));
                    timer = setTimeout(() => reject(new Error("No Redis message received")), SOCKET_WAIT);
                });
            });

            expect(messages.length).toBe(1);

            const parsed = messages[0];

            expect(parsed.userId).toBe(`${userId}`);
            expect(parsed.message.payload).toEqual(message.payload);
            expect(parsed.message.metadata.userReqId).toEqual(message.metadata.userReqId);

            ws.close();
            await redisListener.unsubscribe('test.chat.incoming');
            await redisListener.quit();
        });


        test('Server propagates message from redis correctly.', async () => {
            const ws = newSocket();
            const redisPublisher = new Redis(process.env.REDIS_URL);
            const msg1 = `{ "userId": "${userId}", "message": { "source": "chat", "type": "event", "payload": { "message": "Msg1." } } }`;

            const responses = [];

            await new Promise((resolve, reject) => {
                ws.on("error", reject);
                ws.on('message', msg => { responses.push(JSON.parse(msg.toString())); });
                ws.on('open', async () => { await redisPublisher.publish('test.ws.outgoing', msg1); });

                //Allow time for socket propagation
                setTimeout(() => resolve(), SOCKET_WAIT);
            });

            expect(responses.length).toBe(2);
            const message = responses[1];
            expect(message.source).toBe('chat');
            expect(message.type).toBe('event');
            expect(message.payload).toEqual({ message: 'Msg1.' });

            ws.close();
            await redisPublisher.quit();
        });


        test('Server propagates message from redis to appropriate client.', async () => {
            // Prepare users
            const user1 = { username: 'Test1', password: 'Pass1' };
            const user2 = { username: 'Test2', password: 'Pass2' };

            user1.id = await createTestUser(user1.username, user1.password);
            user2.id = await createTestUser(user2.username, user2.password);

            user1.token = sign(user1.id, user1.username);
            user2.token = sign(user2.id, user2.username);

            // Prepare redis
            const redisPublisher = new Redis(process.env.REDIS_URL);

            const responses1 = [];
            const responses2 = [];

            const socket1 = newSocket(user1.token);
            const socket2 = newSocket(user2.token);

            //4 messages, 3 to user1, 1 to user2
            const msg1 = `{ "userId": "${user1.id}", "message": { "source": "chat", "type": "event", "payload": { "message": "Msg1." } } }`;
            const msg2 = `{ "userId": "${user2.id}", "message": { "source": "chat", "type": "event", "payload": { "message": "Msg2." } } }`;
            const msg3 = `{ "userId": "${user1.id}", "message": { "source": "chat", "type": "event", "payload": { "message": "Msg3." } } }`;
            const msg4 = `{ "userId": "${user1.id}", "message": { "source": "chat", "type": "event", "payload": { "message": "Msg4." } } }`;

            await new Promise((resolve, reject) => {
                let connectionCounter = 0;

                socket1.on("error", reject);
                socket2.on("error", reject);

                socket1.on('message', msg => { responses1.push(JSON.parse(msg.toString())); });
                socket2.on('message', msg => { responses2.push(JSON.parse(msg.toString())); });

                socket1.on('open', async () => { connectionCounter++; if (connectionCounter === 2) await send(); });
                socket2.on('open', async () => { connectionCounter++; if (connectionCounter === 2) await send(); });

                //Both clients connected, send messages
                async function send() {
                    await redisPublisher.publish('test.ws.outgoing', msg1);
                    await redisPublisher.publish('test.ws.outgoing', msg2);
                    await redisPublisher.publish('test.ws.outgoing', msg3);
                    await redisPublisher.publish('test.ws.outgoing', msg4);

                    //Allow time for socket propagation
                    setTimeout(() => resolve(), 2 * SOCKET_WAIT);
                }
            });

            //Expect n messages + initial "server ready" message
            expect(responses1.length).toBe(4);
            expect(responses2.length).toBe(2);


            // Cleanup
            socket1.close();
            socket2.close();
            await redisPublisher.quit();
            await deleteUser(user1.id);
            await deleteUser(user2.id);
        });


        test('Server notifies correctly Redis if user closes all connections', async () => {
            //Create users
            const user1 = { username: 'Test1', password: 'Pass1' };
            const user2 = { username: 'Test2', password: 'Pass2' };

            user1.id = await createTestUser(user1.username, user1.password);
            user2.id = await createTestUser(user2.username, user2.password);

            user1.token = sign(user1.id, user1.username);
            user2.token = sign(user2.id, user2.username);

            // User 1 has 1 connection, User 2 has 2 connections
            const socket1 = newSocket(user1.token);
            const socket2 = newSocket(user2.token);
            const socket3 = newSocket(user2.token);

            const redisListener = new Redis(process.env.REDIS_URL);
            const messages = [];
            await redisListener.subscribe('test.client.disconnected');

            await new Promise((resolve, reject) => {
                redisListener.on('message', (channel, message) => {
                    messages.push(JSON.parse(message));
                });

                let connections = 0;

                socket1.on('open', onConnection);
                socket2.on('open', onConnection);
                socket3.on('open', onConnection);

                function onConnection() {
                    connections++;
                    if(connections === 3){
                        socket1.terminate();
                        socket2.terminate();
                    }
                }

                //Allow time for socket propagation
                setTimeout(() => resolve(), SOCKET_WAIT);
            });

            expect(messages.length).toBe(1);
            expect(messages[0].userId).toBe(user1.id);

            // Cleanup
            socket1.close();
            socket2.close();
            socket3.close();
            await redisListener.unsubscribe('test.client.disconnected');
            await redisListener.quit();
            await deleteUser(user1.id);
            await deleteUser(user2.id);
        });


    });

    test('Handle disconnections gracefully', () => {

    });

});