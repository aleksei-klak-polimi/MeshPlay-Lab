import config from "../config/config.js";
import { createLogger } from "@meshplaylab/shared/src/config/logger.js";

const redisPrefix = config.redisPrefix;
const logger = createLogger('publisher');
let redis = null;

export function publishToService(channel, message) {
  const fullChannel = `${redisPrefix}.${channel}`;
  if(redis)
    redis.publish(fullChannel, JSON.stringify(message));
  else
    logger.warn('Attempted to send a message but redis is not initialized.');
}

/**
 * 
 * @param {import('ioredis').Redis} redisPub
 */
export function initPublisher(redisPub){
  redis = redisPub;
}

export function closePublisher(){
  redis = null;
}
