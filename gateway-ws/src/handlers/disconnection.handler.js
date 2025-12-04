import { publishToService } from "../pubsub/publisher.js";

export default function discnHandler(userId) {
    publishToService("client.disconnected", { userId });
}
