import { WebSocketServer } from "ws";
import { authenticateConnection } from "./auth.js";
import { registerSocket, unregisterSocket } from "./connectionManager.js";
import routeMessage from "./router.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

const logger = createLogger('websocket');

export default function createWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (socket) => {
    console.log('New user connected to the ws server.');

    socket.on('message', (message) => authenticateConnection(message, socket, () => {

      if (socket.readyState !== socket.OPEN) return;
      socket.removeAllListeners('message');
      registerSocket(socket);
      socket.on("close", () => unregisterSocket(socket));

      socket.on("message", (payload) => routeMessage(socket.user.id, payload));
    }));

    socket.on('close', () => console.log('Connection was closed by the user'));
  });

  return wss;
}
