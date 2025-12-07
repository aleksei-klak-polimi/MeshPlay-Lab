import sendMessage from "./utils/sender.js";
import { createLogger } from "@meshplaylab/shared/src/config/logger.js";

const userSockets = new Map(); // userId -> Set<WebSocket>

/**
 * Registers a newly connected WebSocket under the user's ID.
 *
 * This allows the gateway to support multiple simultaneous connections
 * per user (e.g., browser tabs, mobile + desktop, etc.).
 *
 * @param {import('ws').WebSocket & { user: { id: string } }} socket
 *        The WebSocket instance associated with the authenticated user.
 */
export function registerSocket(socket) {
    const userId = socket.user.id;

    if (!userSockets.has(userId))
        userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket);

};

/**
 * Removes a socket from the user’s active connection set.
 * If this was the user's last connection, their entry is removed entirely.
 *
 * @param {import('ws').WebSocket & { user: { id: string } }} socket
 *        The WebSocket being disconnected.
 */
export function unregisterSocket(socket) {
    const userId = socket.user.id;

    if (!userSockets.has(userId)) return;
    const set = userSockets.get(userId);
    set.delete(socket);
    if (set.size === 0) userSockets.delete(userId);

};

/**
 * Retrieves all active sockets for a given user.
 *
 * Always returns a Set, even when the user has no connections.
 *
 * @param {string} userId - The user whose sockets should be retrieved.
 * @returns {Set<import('ws').WebSocket>} A set of active WebSocket connections.
 */
export function getUserSockets(userId) {

    const sockets = userSockets.get(userId);
    if(!sockets) return new Set();
    else return sockets;

}

/**
 * Broadcasts a message to all active WebSocket connections belonging to a user.
 *
 * The message must be an instance of a `BaseResponse` subclass
 * (e.g. `EventResponse`, `UpdateResponse`), as it will be serialized and sent
 * using `sendMessage`.
 *
 * @param {string} userId - ID of the user to broadcast to.
 * @param {import('../protocol/frames/response.js').BaseResponse} message - The response to send.
 */
export function broadcastToUser(userId, message) {

    const logger = createLogger('connectionManager.broadcastToUser');
    logger.debug(`Received message to broadcast to userId: ${userId}.`);

    const sockets = getUserSockets(userId);
    logger.debug(`Found ${sockets.size} sockets for userId: ${userId}.`);

    logger.debug(`Broadcasting message to userId: ${userId}.`);

    sockets.forEach((s) => { sendMessage(s, message); });
};
