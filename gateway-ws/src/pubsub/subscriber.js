import config from "../config/config.js";
import { broadcastToUser } from "../server/connectionManager.js";
import { createLogger } from "@meshplaylab/shared/src/config/logger.js";
import parse from "../utils/parseMessage.js";
import { validateRedis as validate } from "../protocol/validators/validateMessage.js";
import { EventResponse, UpdateResponse } from "../protocol/frames/response.js";

const logger = createLogger('subscriber');
const redisPrefix = config.redisPrefix;
const channel = `${redisPrefix}.ws.outgoing`;
let redis = null;

/**
 * Initializes the Redis subscriber responsible for delivering messages
 * from backend services to connected WebSocket clients.
 *
 * Subscribes to a single outgoing channel:
 * `${redisPrefix}.ws.outgoing`
 *
 * After validation, the subscriber converts messages into the appropriate
 * protocol response class (`EventResponse` or `UpdateResponse`) and
 * broadcasts them to all of a user's active WebSocket connections.
 *
 * @async
 * @param {import('ioredis').Redis} redisSub - Redis client configured for pub/sub.
 */
export async function initSubscriber(redisSub) {
  logger.info('Initializing Redis subscribe', 'initSubscriber');

  redis = redisSub;
  await redis.subscribe(channel);
  redis.on('message', onMessage);

  logger.info('Redis subscribe initialized', 'initSubscriber');
}

/**
 * Unsubscribes from Redis and removes listeners.
 *
 * Safe to call during application shutdown.
 */
export async function closeSubscriber() {
  if(redis){
    logger.debug('Found redis connection, unsubscribing and removing listener.');
    await redis.unsubscribe(channel);
    redis.removeListener('message', onMessage);
    redis = null;
    return;
  } else {
    logger.debug('No redis connection was found.');
    return;
  }
}

/**
 * Handles inbound Redis pub/sub messages from backend services.
 *
 * Flow:
 * 1. Parse and validate Redis message.
 * 2. Determine response type (`event` or `update`).
 * 3. Create appropriate protocol frame (`EventResponse` / `UpdateResponse`).
 * 4. Broadcast to all sockets belonging to the user.
 *
 * @param {string} channel - Redis channel the message was received from.
 * @param {string} rawMessage - Raw JSON payload.
 * @private
 */
export function onMessage(channel, rawMessage){
  logger.debug('Received message from redis.', 'redisSub.on("message")');

  try {
      let parsed;
      try{
        parsed = parse(rawMessage);
        validate(parsed);
      } catch (err){
        logger.error('Received invalid message from redis. Will not broadcast message.',
          'redisSub.on("message")', err);
        return;
      }

      const { userId, message } = parsed;

      let protocolMessage

      if(message.type === 'event')
        protocolMessage = new EventResponse(message.source, message.payload);
      else
        protocolMessage = new UpdateResponse(message.source, message.status, message.metadata);

      broadcastToUser(userId, protocolMessage);

    } catch (err) {
      logger.error('Unexpected error while processing message from redis.', 'redisSub.on("message")', err);
    }
}


