import { WebSocketServer } from "ws";
import { authenticateConnection } from "./auth.js";
import { registerSocket, unregisterSocket } from "./connectionManager.js";
import routeMessage from "./router.js";
import parse from "../middleware/parseMessage.js";
import validateMessage from "../middleware/validateMessage.js";
import { sanitizeError } from "../utils/errorSanitizer.js";
import { errorResponse, successResponse, ackResponse } from "../utils/response.js";
import { AuthenticationError } from "../constants/errors.js";
import codes from "../protocol/status/codes.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { SocketLoggerMetadata } from "../config/logger.js";
import { randomUUID } from "crypto";

const logger = createLogger('websocket');

export default function createWebSocketServer(server) {
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









  async function handleFirstMessage(rawMessage, socket){
    const logger = createLogger('websocket.socket.handleFirstMessage');
    const metadata = new SocketLoggerMetadata(socket.id, randomUUID());
    logger.setMetadata(metadata);

    // Avoids race conditions between events if validateJWT takes too long.
    // If pendingAuth is false or is not a property (default),
    // then the auth handler starts the auth process and sets it to true.
    // If pendingAuth is true then other requests by the client before auth is done will be ignored.
    if (socket.pendingAuth) {
      logger.warn(`Received another message while authentication still pending, ignoring message.`);
      return;
    }
    else if (socket.user) {
      logger.error(`Received message but user already authenticated, ignoring message.`);
      return;
    }
    else
        socket.pendingAuth = true;

    //Parse message
    let message;
    try{
      message = parse(rawMessage);
    } catch (err) {
      logger.info('Error while parsing user message. Closing connection.');
      const sanitized = sanitizeError(err, 'Unexpected error while parsing the message.');
      errorResponse(socket, 'auth', sanitized, metadata);
      socket.terminate();
      return;
    }

    //Validate message structure
    try{
      validateMessage(message, metadata);
    } catch (err) {
      logger.info('Error while validating user message. Closing connection.');
      const sanitized = sanitizeError(err, 'Unexpected error while validating the message.');
      errorResponse(socket, 'auth', sanitized, metadata);
      socket.terminate();
      return;
    }

    // Check if message is for authentication. If not close the connection.
    if(message.target !== 'auth'){
      logger.info('User did not provide authentication as first message. Closing connection.');
      const error = 
        new AuthenticationError('Provided invalid first message. First message MUST be for authentication.');
      errorResponse(socket, 'auth', error, metadata, message.metadata);
      socket.terminate();
      return;
    }

    // Validate the JWT in message payload.
    try{
      socket.user = await authenticateConnection(message.payload, metadata);
    } catch (err) {
      logger.info('JWT failed validation. Closing connection.');
      const sanitized = sanitizeError(err, 'Unexpected error while validating the token.');
      errorResponse(socket, 'auth', sanitized, metadata, message.metadata);
      socket.terminate();
      return;
    }

    // switch to actual message handler and tell client auth was successful.
    socket.removeAllListeners('message');
    registerSocket(socket);
    socket.on("message", (message) => handleMessage(socket, message));

    successResponse(socket, 'auth', codes.AUTH_SUCCESS, 'Authenticated successfully.', metadata, message.metadata);

    delete socket.pendingAuth;

    logger.info('User authenticated successfully.');
  }






  function handleMessage(socket, rawMessage){
    const logger = createLogger('websocket.socket.handleMessage');
    const metadata = new SocketLoggerMetadata(socket.id, randomUUID());
    logger.setMetadata(metadata);

    logger.debug(`Received user message`);


    //Parse message
    let message;
    try{
      message = parse(rawMessage);
    } catch (err) {
      logger.debug('Error while parsing user message. Sending back error.');
      const sanitized = sanitizeError(err, 'Unexpected error while parsing the message.');
      errorResponse(socket, 'server', sanitized, metadata);
      return;
    }

    //Validate message structure
    try{
      validateMessage(message, metadata);
    } catch (err) {
      logger.info('Error while validating user message. Sending back error.');
      const sanitized = sanitizeError(err, 'Unexpected error while validating the message.');
      errorResponse(socket, 'server', sanitized, metadata);
      return;
    }

    // Route message
    try{
      routeMessage(socket.user.id, message, metadata);
    } catch(err) {
      logger.info('Error while routing user message. Sending back error.');
      const sanitized = sanitizeError(err, 'Unexpected error while routing the message.');
      errorResponse(socket, 'server', sanitized, metadata);
      return;
    }

    // Send to client notification that their message was accepted by the system and forwarded to the microservice.
    ackResponse(socket, metadata, message.metadata);
    
  }








  function handleClose(socket){
    const logger = createLogger('websocket.socket.handleClose');
    const metadata = new SocketLoggerMetadata(socket.id, randomUUID());
    logger.setMetadata(metadata);

    logger.info(`Close called on socket.`);

    if(socket.user){
      logger.debug(`Socket was authenticated, proceding to unregister socket`);
      unregisterSocket(socket);
    }

    logger.info(`Socket closed.`);
  }

  logger.info('Socket server Initialized');
  return wss;
}
