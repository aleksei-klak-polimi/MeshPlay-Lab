import handlers from "../handlers/index.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { InvalidTarget } from "../constants/errors.js";

const logger = createLogger('router.routeMessage');

export default function routeMessage(userId, message, loggerMeta) {
  logger.setMetadata(loggerMeta);
  logger.debug('Routing message for user.');

  const handler = handlers[message.target];

  if (!handler) {

    logger.info(`No handler found for message type: ${message.target}.`);
    throw new InvalidTarget(`No handler found for message type: ${message.target}.`);
    
  }

  logger.debug('Forwarding message to handler.');
  handler(userId, message);
}
