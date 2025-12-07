import config from "../config/config.js";
import { createLogger } from "@meshplaylab/shared/src/config/logger.js";

const redisPrefix = config.redisPrefix;
const logger = createLogger('publisher');
let redis = null;

/**
 * Publishes a message to an internal service through Redis.
 *
 * The message is JSON-stringified and sent to a namespaced Redis channel:
 * `${redisPrefix}.${channel}`
 *
 * Expected message shape:
 * ```
 * {
 *   userId: string,
 *   message: Object   // Typically the same client message structure routed by the gateway
 * }
 * ```
 *
 * Used by handlers such as:
 * - chat.handler -> "chat.incoming"
 * - game.handler -> "game.incoming"
 * - discnHandler -> "client.disconnected"
 *
 * @param {string} channel - Channel name without prefix (e.g., `"chat.incoming"`).
 * @param {Object} message - Payload to publish to the service.
 */
export function publishToService(channel, message) {
  const fullChannel = `${redisPrefix}.${channel}`;
  if(redis)
    redis.publish(fullChannel, JSON.stringify(message));
  else
    logger.warn('Attempted to send a message but redis is not initialized.');
}

/**
 * Initializes the Redis publisher.
 *
 * Must be called before any calls to `publishToService`.
 *
 * @param {import('ioredis').Redis} redisPub - A configured Redis client for publishing.
 */
export function initPublisher(redisPub){
  redis = redisPub;
}

/**
 * Stops publishing and clears the stored Redis client.
 *
 * Safe to call multiple times.
 */
export function closePublisher(){
  redis = null;
}
