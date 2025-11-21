import { redisPub } from "../config/redis.js";

export function publishToService(channel, message) {
  redisPub.publish(channel, JSON.stringify(message));
}
