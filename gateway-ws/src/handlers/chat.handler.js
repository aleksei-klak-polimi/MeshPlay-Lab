import { publishToService } from "../pubsub/publisher.js";

/**
 * Handles messages targeted at the "chat" subsystem.
 *
 * Forwards the message to internal chat services via Redis pub/sub.
 * This decouples the WebSocket gateway from chat-specific business logic.
 *
 * @param {string} userId - ID of the user who sent the message.
 * @param {Object} message - Parsed and validated client message.
 */
export default function chatHandler(userId, message) {
  publishToService("chat.incoming", { userId, message });
}
