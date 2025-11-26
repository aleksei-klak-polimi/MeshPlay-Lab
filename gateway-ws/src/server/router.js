import handlers from "../handlers/index.js";
import validateMessage from "../middleware/validateMessage.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

const logger = createLogger('router.routeMessage');

export default function routeMessage(userId, rawPayload, metadata) {
  logger.setMetadata(metadata);
  logger.info('Routing message for user.');

  let msg;

  try {
    msg = JSON.parse(rawPayload);
  } catch {
    logger.info('Invalid JSON from user.');
    return;
  }

  if (!validateMessage(msg)) {
    logger.info('Invalid message format from user.');
    return;
  }

  const handler = handlers[msg.type];
  if (!handler) {
    logger.info(`No handler for message type ${msg.type}.`);
    return;
  }

  logger.debug('Forwarding message to handler.');
  handler(userId, msg.payload);
}
