import { redisSub } from "../config/redis.js";
import config from "../config/config.js";
import { broadcastToUser } from "../server/connectionManager.js";
import { createLogger } from "@meshplaylab/shared/src/config/logger.js";
import parse from "../utils/parseMessage.js";
import { validateRedis as validate } from "../utils/validateMessage.js";
import { EventResponse, UpdateResponse } from "../protocol/frames/response.js";

const logger = createLogger('subscriber');
const redisPrefix = config.redisPrefix;
const channel = `${redisPrefix}.ws.outgoing`;

export function initRedisSubscriber() {
  logger.info('Initializing Redis subscribe', 'initRedisSubscriber');

  redisSub.subscribe(channel);

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

      let protocolMessage

      if(message.type === 'event')
        protocolMessage = new EventResponse(message.source, message.payload);
      else
        protocolMessage = new UpdateResponse(message.source, message.status, message.metadata);

      broadcastToUser(userId, protocolMessage);

    } catch (err) {
      logger.error('Unexpected error while processing message from redis.', 'redisSub.on("message")', err);
    }

  });

  logger.info('Redis subscribe initialized', 'initRedisSubscriber');
}

export async function closeRedisSubscriber() {
  await redisSub.unsubscribe(channel);
  redisSub.removeAllListeners();
}
