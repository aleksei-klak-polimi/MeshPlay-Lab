import { publishToService } from "../pubsub/publisher.js";

export default function chatHandler(userId, payload) {
  publishToService("chat.incoming", { userId, payload });
}
