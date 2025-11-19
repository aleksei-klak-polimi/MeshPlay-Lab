import { WebSocketServer } from "ws";
import { authenticateConnection } from "./auth.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

const logger = createLogger('websocket');

export default function createWebSocketServer(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (socket, req) => {

    console.log('New user connected to the ws server.');

    socket.on('message', (message) => authenticateConnection(message, socket, () => {

      if (socket.readyState !== socket.OPEN) return;
      socket.removeAllListeners('message');
      socket.on('message', (message) => onMessageAuthenticated(message, socket));

    }));

    socket.on('close', () => console.log('Connection was closed by the user'));
  });

  function onMessageAuthenticated (message, socket){
    console.log(`Received the following message: ${message}`);
    socket.send(`Server received: ${message}`);
  }

  return wss;
}
