import { publishToService } from "../pubsub/publisher.js";

export default function chatHandler(userId, message) {
  publishToService("chat.incoming", { userId, message });
}
