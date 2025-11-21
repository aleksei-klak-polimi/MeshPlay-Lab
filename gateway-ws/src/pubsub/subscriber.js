import { redisSub } from "../config/redis.js";
import { broadcastToUser } from "../server/connectionManager.js";

export function initRedisSubscriber() {
  redisSub.subscribe("ws.outgoing");

  redisSub.on("message", (channel, message) => {

    const { userId, payload } = JSON.parse(message);
    broadcastToUser(userId, payload);
    
  });
}
