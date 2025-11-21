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

    return userSockets.get(userId) || new Set();

}

export function broadcastToUser(userId, message) {

    const sockets = getUserSockets(userId);
    sockets.forEach((s) => {
        if (s.readyState === s.OPEN) s.send(message);
    });

};







