import { WebSocketServer } from "ws";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { randomUUID } from "crypto";
import { SocketLoggerMetadata } from "../config/logger.js";
import { sanitizeError } from "../utils/errorSanitizer.js";
import { successResponse, errorResponse, ackResponse } from "../utils/sendResponse.js";
import { registerSocket, unregisterSocket, getUserSockets } from "./connectionManager.js";
import discnHandler from "../handlers/disconnection.handler.js";
import { initSubscriber, closeSubscriber } from '../pubsub/subscriber.js';
import { initPublisher, closePublisher } from "../pubsub/publisher.js";
import codes from "../protocol/status/codes.js";
import { validateClient } from "../utils/validateMessage.js";
import parse from "../utils/parseMessage.js";
import routeMessage from "./router.js";

export default async function createWebSocketServer(server, {redisPub, redisSub}) {
  const logger = createLogger('websocket');
  logger.info('Initializing socket server', 'createWebSocketServer');

  await initSubscriber(redisSub);
  initPublisher(redisPub);

  const wss = new WebSocketServer(server);

  wss.on("connection", async (socket) => {
    socket.id = randomUUID();
    registerSocket(socket);
    socket.isAlive = true;

    socket.on('pong', () => { socket.isAlive = true; });
    socket.on('message', (message) => handleMessage(socket, message));
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

  wss.closeAsync = async () => { await closeSubscriber(); closePublisher() };

  return wss;
}



// Socket functions
export function handleMessage(socket, rawMessage) {
  const logger = createLogger('websocket.handleMessage');
  const requestId = randomUUID();
  const logMeta = new SocketLoggerMetadata(socket.id, requestId);
  logger.setMetadata(logMeta);

  let message;

  try {
    // Validate message
    try {

      message = parse(rawMessage, logMeta);
      if (!validateClient(message, logMeta)) return;
      message.metadata.serverSideReqId = requestId;

    } catch (err) {
      message = null;
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

    if(message)
      errorResponse(socket, 'server', sanitized, logMeta, message.metadata);
    else
      errorResponse(socket, 'server', sanitized, logMeta);
  }
}

export function handleClose(socket) {
  const logger = createLogger('websocket.handleClose');
  const logMeta = new SocketLoggerMetadata(socket.id);
  logger.setMetadata(logMeta);

  logger.info(`Close called on socket.`, 'handleClose');

  unregisterSocket(socket);

  //Check if user has any more sockets left
  const userId = socket.user.id;
  if (getUserSockets(userId).size === 0){
    logger.debug(`UserId: ${userId} lost all connections, notifying other services...`);
    discnHandler(userId);
  }

  logger.info(`Socket closed.`);
}
