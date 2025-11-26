import { redisSub } from "../config/redis.js";
import { broadcastToUser } from "../server/connectionManager.js";
import { createLogger } from "@meshplaylab/shared/src/config/logger.js";

const logger = createLogger('subscriber');

export function initRedisSubscriber() {
  logger.info('Initializing Redis subscribe', 'initRedisSubscriber');

  redisSub.subscribe("ws.outgoing");

  redisSub.on("message", (channel, message) => {

    const { userId, payload } = JSON.parse(message);
    broadcastToUser(userId, payload);

  });

  logger.info('Redis subscribe initialized', 'initRedisSubscriber');
}
