import Redis from "ioredis";

/**
 * Creates and returns a new Redis client instance using the `REDIS_URL`
 * environment variable.
 *
 * @returns {import('ioredis').Redis} A new Redis client instance.
 */
export function createRedis() {
    return new Redis(process.env.REDIS_URL);
}

/**
 * Gracefully closes a Redis client connection if it is open.
 * If the client is already closing, closed, or reconnecting, no action is taken.
 *
 * @param {import('ioredis').Redis} redis - The Redis client instance to close.
 * 
 * @returns {Promise<void>} Resolves once the Redis connection is fully closed.
 */
export async function closeRedis(redis) {
    if (!redis) return;

    // Statuses that indicate the client is already closing or closed
    const closedStates = ['end', 'close', 'reconnecting', 'closing'];
    if (closedStates.includes(redis.status)) {
        return; // nothing to do
    }
    await redis.quit().catch(() => redis.disconnect());

    return;
}