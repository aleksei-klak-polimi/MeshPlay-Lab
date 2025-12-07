import { publishToService } from "../pubsub/publisher.js";

/**
 * Handles messages targeted at the "game" subsystem.
 *
 * This is currently a generic placeholder intended to route messages
 * for future game modules (e.g., poker, blackjack, etc.).
 * For now, all game-related messages are forwarded to `"game.incoming"`.
 *
 * @param {string} userId - ID of the user who sent the message.
 * @param {Object} message - Parsed and validated client message.
 */
export default function gameHandler(userId, message) {
  publishToService("game.incoming", { userId, message });
}
