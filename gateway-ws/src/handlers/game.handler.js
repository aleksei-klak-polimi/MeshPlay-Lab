import { publishToService } from "../pubsub/publisher.js";

export default function gameHandler(userId, message) {
  publishToService("game.incoming", { userId, message });
}
