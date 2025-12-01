import { WebSocketServer } from "ws";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { randomUUID } from "crypto";
import { SocketLoggerMetadata } from "../config/logger.js";
import { sanitizeError } from "../utils/errorSanitizer.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { registerSocket, unregisterSocket } from "./connectionManager.js";
import codes from "../protocol/status/codes.js";
import validate from "../middleware/validate.middleware.js";
import parse from "../middleware/parse.middleware.js";
import auth from "../middleware/auth.middleware.js";
import routeMessage from "./router.js";

export default function createWebSocketServer(server) {
  const logger = createLogger('websocket');
  logger.info('Initializing socket server', 'createWebSocketServer');

  const wss = new WebSocketServer({ server });

  wss.on("connection", async (socket, req) => {
    // Assign random id to connection
    socket.id = randomUUID();

    logger.info(`New user connected to the ws server from: ${req.socket.remoteAddress}.
Socket ID: ${socket.id} assigned to connection.`, 'wss.on("connection")');

    socket.on('message', (message) => handleFirstMessage(message, socket));
    socket.on('close', () => handleClose(socket));
  });

  logger.info('Socket server Initialized');
  return wss;
}



// Socket functions
async function handleFirstMessage(rawMessage, socket) {
  const logger = createLogger('websocket.handleFirstMessage');
  const requestId = randomUUID();
  const logMeta = new SocketLoggerMetadata(socket.id, requestId);
  logger.setMetadata(logMeta);

  try {
    // If no mutex then this is the first message received.
    // If there is a mutex then the first message was already received. Ignore this new message.
    if (!getMutex(socket, logger)) triggerMutex(socket);
    else return;

    const message = parse(socket, rawMessage, true, logMeta);
    if (!message) return;

    if (!validate(socket, message, true, logMeta)) return;

    message.metadata.serverSideReqId = requestId;

    if (! await auth(socket, message, true, logMeta)) return;

    // Switch to actual message handler
    socket.removeAllListeners('message');
    registerSocket(socket);
    socket.on("message", (message) => handleMessage(socket, message));
    removeMutex(socket);

    // Tell client server is ready for messages.
    successResponse(socket, 'server', codes.SERVER_READY, 'Server is ready to receive messages.', logMeta);

  } catch (err) {

    logger.error('Encountered unexpected error while processing the first message. Closing connection.',
      null, err);
    const sanitized = sanitizeError(err, 'Unexpected error while processing message.', logMeta);
    errorResponse(socket, 'auth', sanitized, logMeta);
    socket.terminate();

  }
}

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



// Helper functions
function getMutex(socket, logger) {
  if (socket.pendingAuth) {
    logger.warn(`Received another message while authentication still pending, ignoring message.`, 'getMutex');
    return true;
  }
  else if (socket.user) {
    logger.error(`Received message but user already authenticated, ignoring message.`, 'getMutex');
    return true;
  }
}

function triggerMutex(socket) {
  socket.pendingAuth = true;
}

function removeMutex(socket) {
  delete socket.pendingAuth;
}



