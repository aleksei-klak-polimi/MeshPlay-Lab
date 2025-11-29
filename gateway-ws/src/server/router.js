import handlers from "../handlers/index.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { InvalidTarget } from "../constants/errors.js";

const logger = createLogger('router.routeMessage');

export default function routeMessage(userId, message, metadata) {
  logger.setMetadata(metadata);
  logger.info('Routing message for user.');

  const handler = handlers[message.target];
  if (!handler) {
    logger.info(`No handler found for message type: ${message.target}.`);
    throw new InvalidTarget(`No handler found for message type: ${message.target}.`);
  }

  logger.debug('Forwarding message to handler.');
  try{
    handler(userId, message);
  } catch (err) {
    logger.error(`Error while forwarding message to handler ${message.target}`, '', err);
  }
}
