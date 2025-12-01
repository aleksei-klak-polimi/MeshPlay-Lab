import handlers from "../handlers/index.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { InvalidTarget } from "../constants/errors.js";
import { ackResponse, errorResponse } from "../utils/response.js";
import { sanitizeError } from "../utils/errorSanitizer.js";

const logger = createLogger('router.routeMessage');

export default function routeMessage(socket, message, loggerMeta) {
  logger.setMetadata(loggerMeta);
  logger.debug('Routing message for user.');

  const handler = handlers[message.target];

  if (!handler) {

    logger.info(`No handler found for message type: ${message.target}.`);
    const error = new InvalidTarget(`No handler found for message type: ${message.target}.`);
    errorResponse(socket, 'server', error, loggerMeta, message.metadata);
    return;
    
  }

  try{

    logger.debug('Forwarding message to handler.');
    handler(socket.user.id, message);
    // Send to client notification that their message was accepted by the system and forwarded to the microservice.
    ackResponse(socket, loggerMeta, message.metadata);

  } catch (err) {

    logger.error(`Error while forwarding message to handler ${message.target}`, '', err);
    const sanitized = sanitizeError(err, 'Unexpected error while processing the message.', loggerMeta);
    errorResponse(socket, 'server', sanitized, loggerMeta, message.metadata);

  }
}
