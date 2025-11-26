import { WebSocketServer } from "ws";
import { authenticateConnection } from "./auth.js";
import { registerSocket, unregisterSocket } from "./connectionManager.js";
import routeMessage from "./router.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { SocketLoggerMetadata } from "../config/logger.js";
import { randomUUID } from "crypto";

const logger = createLogger('websocket');

export default function createWebSocketServer(server) {
  logger.info('Initializing socket server', 'createWebSocketServer');

  const wss = new WebSocketServer({ server });

  wss.on("connection", async (socket, req) => {
    //Assign random id to connection
    socket.id = randomUUID();

    logger.info(`New user connected to the ws server from: ${req.socket.remoteAddress}.
Socket ID: ${socket.id} assigned to connection.`, 'wss.on("connection")');

    socket.on('message', (message) => handleFirstMessage(message, socket));
    socket.on('close', () => handleClose(socket));
  });

  async function handleFirstMessage(message, socket){
    const socketLogger = createLogger('websocket.socket.handleFirstMessage');
    const metadata = new SocketLoggerMetadata(socket.id, randomUUID());
    socketLogger.setMetadata(metadata);

    // Avoids race conditions between events if validateJWT takes too long.
    // If pendingAuth is false or is not a property (default),
    // then the auth handler starts the auth process and sets it to true.
    // If pendingAuth is true then other requests by the client before auth is done will be ignored.
    if (socket.pendingAuth) {
      socketLogger.warn(`Received another message while authentication still pending.`);
      return;
    }
    else if (socket.user) {
      socketLogger.error(`Received message but user already authenticated, ignoring message.`);
      return;
    }
    else
        socket.pendingAuth = true;

    await authenticateConnection(message, socket, metadata);
    delete socket.pendingAuth;

    // If socket is still open then authentication was successful
    // If auth was successful then remove this function and add actual message handler
    if (socket.readyState !== socket.OPEN) return;

      socket.removeAllListeners('message');
      registerSocket(socket);
      socket.on("message", (message) => handleMessage(socket, message));

  }

  function handleMessage(socket, message){
    const socketLogger = createLogger('websocket.socket.handleMessage');
    const metadata = new SocketLoggerMetadata(socket.id, randomUUID());
    socketLogger.setMetadata(metadata);

    socketLogger.debug(`Received user message`);
    routeMessage(socket.user.id, message, metadata);
  }

  function handleClose(socket){
    const socketLogger = createLogger('websocket.socket.handleClose');
    const metadata = new SocketLoggerMetadata(socket.id, randomUUID());
    socketLogger.setMetadata(metadata);

    logger.info(`User called close on socket.`);

    if(socket.user){
      logger.debug(`Socket was authenticated, proceding to unregister socket`);
      unregisterSocket(socket);
    }

    logger.info(`Socket closed.`);
  }

  logger.info('Socket server Initialized');
  return wss;
}
