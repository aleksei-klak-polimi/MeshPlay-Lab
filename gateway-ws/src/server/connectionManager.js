import { eventResponse, updateResponse } from "../utils/response.js";
import { createLogger } from "@meshplaylab/shared/src/config/logger.js";

const userSockets = new Map(); // userId -> Set<WebSocket>


export function registerSocket(socket) {
    const userId = socket.user.id;

    if (!userSockets.has(userId))
        userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket);

};

export function unregisterSocket(socket) {
    const userId = socket.user.id;

    if (!userSockets.has(userId)) return;
    const set = userSockets.get(userId);
    set.delete(socket);
    if (set.size === 0) userSockets.delete(userId);

};

export function getUserSockets(userId) {

    const sockets = userSockets.get(userId);
    if(!sockets) return new Set();
    else return sockets;

}

export function broadcastToUser(userId, message) {

    const logger = createLogger('connectionManager.broadcastToUser');
    logger.debug(`Received message to broadcast to userId: ${userId}.`);

    const sockets = getUserSockets(userId);
    logger.debug(`Found ${sockets.size} sockets for userId: ${userId}.`);

    if(message.type === 'event'){
        logger.debug(`Broadcasting event message to userId: ${userId}.`);

        sockets.forEach((s) => {
            eventResponse(s, message.source, message.payload);
        });
    } else if(message.type === 'update'){
        logger.debug(`Broadcasting update message to userId: ${userId}.`);

        sockets.forEach((s) => {
            updateResponse(s, message.source, message.status, null, message.metadata);
        });
    }

};







