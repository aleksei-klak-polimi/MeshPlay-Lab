import { WebSocketServer } from "ws";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { randomUUID } from "crypto";
import { SocketLoggerMetadata } from "../config/logger.js";
import { sanitizeError } from "../utils/errorSanitizer.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { registerSocket, unregisterSocket } from "./connectionManager.js";
import { initRedisSubscriber } from '../pubsub/subscriber.js';
import codes from "../protocol/status/codes.js";
import validate from "../middleware/validate.middleware.js";
import parse from "../middleware/parse.middleware.js";
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
  const interval = setInterval(function ping(){
    wss.clients.forEach((socket) => {

      if(socket.isAlive === false){
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

    const message = parse(socket, rawMessage, false, logMeta);
    if (!message) return;

    if (!validate(socket, message, false, logMeta)) return;

    message.metadata.serverSideReqId = requestId;

    // Route message
    try {
      routeMessage(socket, message, logMeta);
    } catch (err) {
      logger.info('Error while routing user message. Sending back error.');
      const sanitized = sanitizeError(err, 'Unexpected error while routing the message.', logMeta);
      errorResponse(socket, 'server', sanitized, logMeta, message.metadata);
      return;
    }

  } catch (err) {

    logger.error('Encountered unexpected error while processing the message.',
      null, err);
    const sanitized = sanitizeError(err, 'Unexpected error while processing message.', logMeta);
    errorResponse(socket, 'auth', sanitized, logMeta);

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
