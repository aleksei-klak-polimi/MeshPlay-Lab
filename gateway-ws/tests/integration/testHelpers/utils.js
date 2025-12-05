import UserModel from '@meshplaylab/shared/src/models/user.model';
import Redis from "ioredis";

export function onSocketOpen(ws) {
    return new Promise((resolve, reject) => {
        if (ws.readyState === WebSocket.OPEN) return resolve(ws);

        ws.once('open', () => resolve(ws));
        ws.once('error', reject);
    })
}

export async function createTestUser(username, password, getConnection) {
    let connection;
    try {
        connection = await getConnection();
        const id = await UserModel.create(connection, { username, passwordHash: password, createdAt: new Date() });
        return id;
    } finally {
        if (connection) connection.release();
    }
}

export async function deleteUser(userId, getConnection) {
    let connection;
    try {
        connection = await getConnection();
        await UserModel.delete(connection, userId);
    } finally {
        if (connection) connection.release();
    }
}

export async function createRedisSubscriber(channel, handler) {
  const client = new Redis(process.env.REDIS_URL);
  await client.subscribe(channel);
  client.on("message", handler);
  return client;
}

export async function waitFor(conditionFn, timeout) {
  const start = Date.now();
  while (!conditionFn()) {
    await wait(5);
    if (Date.now() - start > timeout)
      throw new Error("Timeout waiting for condition");
  }
}

export function wait(ms) {
  return new Promise(res => setTimeout(res, ms));
}