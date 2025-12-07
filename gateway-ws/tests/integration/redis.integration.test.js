import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { getConnection, pool } from '@meshplaylab/shared/src/config/db.js';
import sign from '@meshplaylab/shared/src/utils/generateJWT';
import Redis from "ioredis";
import WebSocket from 'ws';
import app from '../../src/app';

// Import utils
import { onSocketOpen, createTestUser, deleteUser, createRedisSubscriber, waitFor, wait } from './testHelpers/utils';

import setupDB from '@meshplaylab/shared/tests/integration/setup/setupDB.js';
import teardownDB from '@meshplaylab/shared/tests/integration/setup/teardownDB.js';

const SOCKET_WAIT = 100;
let port, token, userId;
const baseSocketUrl = 'ws://localhost';

beforeAll(async () => {
    // Start with fresh testing db
    await teardownDB(false);
    await setupDB(false);

    // Create a test user and JWT
    userId = await createTestUser('TestUser', 'TestPassHash', getConnection);
    token = sign(userId, 'TestUser');

    port = process.env.PORT;
    await new Promise(res => app.listen(port, () => res()));
});

afterAll(async () => {
    app.close();
    await app.closeAsync();
    await pool.end();
    await teardownDB(false);
});

afterEach(() => {
    jest.clearAllTimers();
});


// Helper functions
function newSocket(customToken = null) {
    if (customToken)
        return new WebSocket(`${baseSocketUrl}:${port}`, { headers: { Authorization: `Bearer ${customToken}` } });
    return new WebSocket(`${baseSocketUrl}:${port}`, { headers: { Authorization: `Bearer ${token}` } });
}

function buildMessage(target, payload, metadata = { userReqId: "xyz789" }) {
    return { target, payload, metadata };
}

function attachMessageCollector(ws, store) {
    ws.on('message', msg => store.push(JSON.parse(msg.toString())));
}



// Test suite
describe('Tests for message handling Between the Client, the WSS and Redis', () => {

    test('Server propagates message to redis pubsub.', async () => {
        const ws = newSocket();
        const message = buildMessage("chat", { text: "Hello World!" });
        const messages = [];

        const redisListener = await createRedisSubscriber("test.chat.incoming", (channel, msg) => {
            messages.push(JSON.parse(msg));
        });

        await onSocketOpen(ws);
        ws.send(JSON.stringify(message));

        // Wait for Redis to receive something
        await waitFor(() => messages.length > 0, SOCKET_WAIT);

        // Verify results
        expect(messages.length).toBe(1);
        const parsed = messages[0];

        expect(parsed.userId).toBe(`${userId}`);
        expect(parsed.message.payload).toEqual(message.payload);
        expect(parsed.message.metadata.userReqId).toEqual(message.metadata.userReqId);

        ws.close();
        await redisListener.unsubscribe('test.chat.incoming');
        await redisListener.quit();
    });


    test('Server propagates message from redis to client correctly.', async () => {
        const ws = newSocket();
        const redisPublisher = new Redis(process.env.REDIS_URL);
        const msg = JSON.stringify({
            userId: `${userId}`,
            message: {
                source: 'chat',
                type: 'event',
                payload: { message: 'Msg1.' }
            }
        });

        const responses = [];
        attachMessageCollector(ws, responses);

        await onSocketOpen(ws);
        await redisPublisher.publish('test.ws.outgoing', msg);

        await wait(SOCKET_WAIT);

        // Verify results
        expect(responses.length).toBe(2); // includes server-ready message

        const message = responses[1];
        expect(message.source).toBe('chat');
        expect(message.type).toBe('event');
        expect(message.payload).toEqual({ message: 'Msg1.' });

        ws.close();
        await redisPublisher.quit();
    });


    test('Server propagates message from redis to correct client.', async () => {
        // Prepare users
        const createUser = async (username, pass) => {
            const id = await createTestUser(username, pass, getConnection);
            const token = sign(id, username);
            return { id, token };
        };

        const user1 = await createUser('Test1', 'Pass1');
        const user2 = await createUser('Test2', 'Pass2');

        // Prepare redis
        const redisPublisher = new Redis(process.env.REDIS_URL);

        const c1 = { ws: newSocket(user1.token), messages: [] };
        const c2 = { ws: newSocket(user2.token), messages: [] };

        attachMessageCollector(c1.ws, c1.messages);
        attachMessageCollector(c2.ws, c2.messages);

        await onSocketOpen(c1.ws);
        await onSocketOpen(c2.ws);

        // Message generator
        const mk = (id, text) => JSON.stringify({
            userId: `${id}`,
            message: { source: 'chat', type: 'event', payload: { message: text } }
        });

        //Send 4 messages
        await redisPublisher.publish('test.ws.outgoing', mk(user1.id, 'Msg1.'));
        await redisPublisher.publish('test.ws.outgoing', mk(user2.id, 'Msg2.'));
        await redisPublisher.publish('test.ws.outgoing', mk(user1.id, 'Msg3.'));
        await redisPublisher.publish('test.ws.outgoing', mk(user1.id, 'Msg4.'));

        // Allow time for propagation
        await wait(SOCKET_WAIT);


        //Expect n messages + initial "server ready" message
        expect(c1.messages.length).toBe(4); // includes server-ready
        expect(c2.messages.length).toBe(2); // includes server-ready


        // Cleanup
        c1.ws.close();
        c2.ws.close();
        await redisPublisher.quit();
        await deleteUser(user1.id, getConnection);
        await deleteUser(user2.id, getConnection);
    });


    test('Server notifies correctly Redis if user closes all connections', async () => {
        //Create users
        const createUser = async (username, pass) => {
            const id = await createTestUser(username, pass, getConnection);
            const token = sign(id, username);
            return { id, token };
        };

        const user1 = await createUser('Test1', 'Pass1');
        const user2 = await createUser('Test2', 'Pass2');

        // User 1 has 1 connection, User 2 has 2 connections
        const s1 = newSocket(user1.token);
        const s2 = newSocket(user2.token);
        const s3 = newSocket(user2.token);

        const disconnected = [];
        const redisListener = await createRedisSubscriber('test.client.disconnected', (ch, msg) => {
            disconnected.push(JSON.parse(msg));
        });

        await onSocketOpen(s1);
        await onSocketOpen(s2);
        await onSocketOpen(s3);

        s1.terminate();
        s2.terminate();

        await wait(SOCKET_WAIT);

        expect(disconnected.length).toBe(1);
        expect(disconnected[0].userId).toBe(user1.id);

        // Cleanup
        s1.close();
        s2.close();
        s3.close();
        await redisListener.unsubscribe('test.client.disconnected');
        await redisListener.quit();
        await deleteUser(user1.id, getConnection);
        await deleteUser(user2.id, getConnection);
    });
});