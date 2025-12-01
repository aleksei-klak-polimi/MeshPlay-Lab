import { redisSub } from "../config/redis.js";
import { broadcastToUser } from "../server/connectionManager.js";
import { createLogger } from "@meshplaylab/shared/src/config/logger.js";
import parse from "../utils/parseMessage.js";
import { validateRedis as validate } from "../utils/validateMessage.js";

const logger = createLogger('subscriber');

export function initRedisSubscriber() {
  logger.info('Initializing Redis subscribe', 'initRedisSubscriber');

  redisSub.subscribe("ws.outgoing");

  redisSub.on("message", (channel, rawMessage) => {
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
      broadcastToUser(userId, message);

    } catch (err) {
      logger.error('Unexpected error while processing message from redis.', 'redisSub.on("message")', err);
    }

  });

  logger.info('Redis subscribe initialized', 'initRedisSubscriber');
}
