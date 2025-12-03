import config from "../config/config.js";
import { redisPub } from "../config/redis.js";

const redisPrefix = config.redisPrefix;

export function publishToService(channel, message) {
  const fullChannel = `${redisPrefix}.${channel}`;
  redisPub.publish(fullChannel, JSON.stringify(message));
}
