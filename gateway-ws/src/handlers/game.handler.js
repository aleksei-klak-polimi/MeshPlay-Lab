import { publishToService } from "../pubsub/publisher.js";

export default function gameHandler(userId, payload) {
  publishToService("game.incoming", { userId, ...payload });
}
