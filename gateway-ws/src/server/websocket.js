import { WebSocketServer } from "ws";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { randomUUID } from "crypto";
import { SocketLoggerMetadata } from "../config/logger.js";
import { sanitizeError } from "../utils/errorSanitizer.js";
import { errorResponse, ackResponse, serverReadyResponse } from "../protocol/frames/customResponses.js";
import sendMessage from "../utils/sendMessage.js";
import { registerSocket, unregisterSocket, getUserSockets } from "./connectionManager.js";
import discnHandler from "../handlers/disconnection.handler.js";
import { initSubscriber, closeSubscriber } from '../pubsub/subscriber.js';
import { initPublisher, closePublisher } from "../pubsub/publisher.js";
import codes from "../protocol/status/codes.js";
import { validateClient } from "../utils/validateMessage.js";
import parse from "../utils/parseMessage.js";
import routeMessage from "./router.js";

const PING_INTERVAL = 30000;

/**
 * @typedef {import('ws').WebSocketServer & {
 *   closeAsync: closeAsync,
 * }} ExtendedWebSocketServer
 */
/**
 * Creates and initializes the WebSocket server used by the gateway.
 *
 * Responsibilities:
 * - Initializes Redis pub/sub subscriber and publisher
 * - Attaches WebSocket event listeners
 * - Sets up ping/pong keepalive
 * - Injects graceful shutdown helper (`wss.closeAsync`)
 *
 * @async
 * @param {import('http').Server} server - The HTTP server used to attach WebSocket upgrades.
 * @param {Object} redis - The object containing the redis clients
 * @param {import('ioredis').Redis} redis.redisPub - Redis client used for publishing
 * @param {import('ioredis').Redis} redis.redisSub - Redis client used for subscribing
 *
 * @returns {Promise<ExtendedWebSocketServer>} A fully initialized WebSocket server instance.
 */
export default async function createWebSocketServer(server, { redisPub, redisSub }) {
  const logger = createLogger('websocket');
  logger.info('Initializing socket server', 'createWebSocketServer');

  await initSubscriber(redisSub);
  initPublisher(redisPub);

  const wss = new WebSocketServer(server);

  wss.on("connection", (socket) => handleConnection(socket));
  wss.on('close', () => clearInterval(interval));

  // Ping Pong logic
  const interval = setInterval(() => performPingCheck(wss, logger), PING_INTERVAL);
  wss.closeAsync = closeAsync;

  logger.info('Socket server Initialized');
  return wss;
}

/**
  * Graceful shutdown helper for the WebSocket server.
  * Cleans Redis subscriber and publisher connections from listeners and subscriptions added during server creation.
  *
  * @returns {Promise<void>}
  */
async function closeAsync() {
  await closeSubscriber();
  closePublisher();
}


// Socket events functions

/**
 * Handles an incoming WebSocket message from a client.
 *
 * Steps performed:
 * 1. Parse JSON safely.
 * 2. Validate message structure and permissions.
 * 3. Attach server-side request ID to metadata.
 * 4. Route message to internal handlers.
 * 5. Send ACK back to the client.
 * 6. On error → sanitize, log appropriately, and send standardized error response.
 *
 * @param {import('ws').WebSocket} socket - The client WebSocket instance.
 * @param {string|Buffer} rawMessage - Raw message data received from the client.
 */
export function handleMessage(socket, rawMessage) {
  const logger = createLogger('websocket.handleMessage');
  const requestId = randomUUID();
  const logMeta = new SocketLoggerMetadata(socket.id, requestId);
  logger.setMetadata(logMeta);

  let message;

  try {
    // Parse + Validate message
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
    sendMessage(socket, ackResponse(message.metadata), logMeta);

  } catch (err) {

    const sanitized = sanitizeError(err, 'Unexpected error while processing message.');

    if (sanitized.code === codes.INTERNAL_ERROR)
      logger.error('Encountered unexpected error while processing the message.',
        null, err);

    if (message)
      sendMessage(socket, errorResponse(sanitized, message.metadata), logMeta);
    else
      sendMessage(socket, errorResponse(sanitized), logMeta);
  }
}

/**
 * Handles socket cleanup after a client disconnects.
 *
 * Actions performed:
 * - Unregister socket from the connection manager
 * - Check if user has no remaining connections
 * - If user lost final connection -> notify other microservices
 *
 * @param {import('ws').WebSocket} socket - The WebSocket being closed.
 */
export function handleClose(socket) {
  const logger = createLogger('websocket.handleClose');
  const logMeta = new SocketLoggerMetadata(socket.id);
  logger.setMetadata(logMeta);

  logger.info(`Close called on socket.`, 'handleClose');

  unregisterSocket(socket);

  //Check if user has any more sockets left
  const userId = socket.user.id;
  if (getUserSockets(userId).size === 0) {
    logger.debug(`UserId: ${userId} lost all connections, notifying other services...`);
    discnHandler(userId);
  }

  logger.info(`Socket closed.`);
}


/**
 * Performs ping/pong keepalive for all connected clients.
 */
function performPingCheck(wss, logger) {
  wss.clients.forEach((socket) => {
    if (!socket.isAlive) {
      logger.debug(
        `SocketID: ${socket.id} did not respond to ping, calling terminate().`
      );
      return socket.terminate();
    }

    socket.isAlive = false;
    socket.ping();
  });
}


/**
 * Handles new connection setup.
 */
function handleConnection(socket) {
  socket.id = randomUUID();
  socket.isAlive = true;
  registerSocket(socket);

  socket.on('pong', () => { socket.isAlive = true; });
  socket.on('message', (message) => handleMessage(socket, message));
  socket.on('close', () => handleClose(socket));

  // Notify client server is ready for messages.
  sendMessage(socket, serverReadyResponse());
}
