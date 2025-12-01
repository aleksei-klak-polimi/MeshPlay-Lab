import { redisSub } from "../config/redis.js";
import { broadcastToUser } from "../server/connectionManager.js";
import { createLogger } from "@meshplaylab/shared/src/config/logger.js";

const logger = createLogger('subscriber');

export function initRedisSubscriber() {
  logger.info('Initializing Redis subscribe', 'initRedisSubscriber');

  redisSub.subscribe("ws.outgoing");

  redisSub.on("message", (channel, rawMessage) => {
    logger.debug('Received message from redis.', 'redisSub.on("message")');

    try {

      const { userId, message } = JSON.parse(rawMessage);

      if(!userId || !message){
        logger.error('Received message from redis is missing userId or message fields. Ignoring message.',
          'redisSub.on("message")');
        return;
      }

      if(!message.source){
        logger.error('Received message from redis is missing "source" field. Ignoring message.',
          'redisSub.on("message")');
        return;
      }

      if(!message.payload){
        logger.error('Received message from redis is missing "payload" field. Ingoring message.',
          'redisSub.on("message")');
        return;
      }

      broadcastToUser(userId, message);

    } catch (err) {

      logger.error('Error while processing message from redis.', 'redisSub.on("message")', err);

    }

  });

  logger.info('Redis subscribe initialized', 'initRedisSubscriber');
}
