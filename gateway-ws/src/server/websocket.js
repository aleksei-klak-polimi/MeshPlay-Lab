import { WebSocketServer } from "ws";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { randomUUID } from "crypto";
import { SocketLoggerMetadata } from "../config/logger.js";
import { sanitizeError } from "../utils/errorSanitizer.js";
import { successResponse, errorResponse, ackResponse } from "../utils/response.js";
import { registerSocket, unregisterSocket } from "./connectionManager.js";
import { initRedisSubscriber } from '../pubsub/subscriber.js';
import codes from "../protocol/status/codes.js";
import { validateClient } from "../utils/validateMessage.js";
import parse from "../utils/parseMessage.js";
import routeMessage from "./router.js";

export default function createWebSocketServer(server) {
  const logger = createLogger('websocket');
  logger.info('Initializing socket server', 'createWebSocketServer');

  initRedisSubscriber();

  const wss = new WebSocketServer(server);

  wss.on("connection", async (socket) => {
    socket.id = randomUUID();
    registerSocket(socket);
    socket.isAlive = true;

    socket.on('pong', () => { socket.isAlive = true; });
    socket.on('message', (message) => handleMessage(message, socket));
    socket.on('close', () => handleClose(socket));

    // Tell client server is ready for messages.
    successResponse(socket, 'server', codes.SERVER_READY, 'Server is ready to receive messages.');
  });

  wss.on('close', function close() {
    clearInterval(interval);
  });

  //Ping-Pong timer logic
  const interval = setInterval(function ping() {
    wss.clients.forEach((socket) => {

      if (socket.isAlive === false) {
        logger.debug(`SocketID: ${socket.id} did not respond to ping, calling terminate().`);
        return socket.terminate();
      }

      socket.isAlive = false;
      socket.ping();
    })
  }, 30000);

  logger.info('Socket server Initialized');
  return wss;
}



// Socket functions
function handleMessage(socket, rawMessage) {
  const logger = createLogger('websocket.handleFirstMessage');
  const requestId = randomUUID();
  const logMeta = new SocketLoggerMetadata(socket.id, requestId);
  logger.setMetadata(logMeta);

  try {

    // Validate message
    try {

      const message = parse(rawMessage, logMeta);
      if (!validateClient(message, logMeta)) return;
      message.metadata.serverSideReqId = requestId;

    } catch (err) {
      logger.info('Client message failed parsing or validation.');
      throw err;
    }

    // Route message
    try {
      routeMessage(socket.user.id, message, logMeta);
    } catch (err) {
      logger.info('Error while routing client message. Sending back error.');
      throw err;
    }

    // Send ack to client
    ackResponse(socket, logMeta, message.metadata);

  } catch (err) {

    const sanitized = sanitizeError(err, 'Unexpected error while processing message.');

    if (sanitized.code === codes.INTERNAL_ERROR)
      logger.error('Encountered unexpected error while processing the message.',
        null, err);

    errorResponse(socket, 'server', sanitized, logMeta);

  }
}

function handleClose(socket) {
  const logger = createLogger('websocket.handleClose');
  const logMeta = new SocketLoggerMetadata(socket.id);
  logger.setMetadata(logMeta);

  logger.info(`Close called on socket.`, 'handleClose');

  if (socket.user) {
    logger.debug(`Socket was authenticated, proceeding to unregister socket`);
    unregisterSocket(socket);
  }

  logger.info(`Socket closed.`);
}
