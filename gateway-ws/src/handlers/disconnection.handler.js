import { publishToService } from "../pubsub/publisher.js";

/**
 * Handles user disconnection events.
 * Notifies other internal services that the user is now offline.
 *
 * Publishes the following payload:
 * ```
 * {
 *   userId: string
 * }
 * ```
 *
 * @param {string} userId - ID of the user who disconnected.
 */
export default function discnHandler(userId) {
    publishToService("client.disconnected", { userId });
}
