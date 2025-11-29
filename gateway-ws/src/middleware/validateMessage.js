import { InvalidRequestFormat } from "../constants/errors.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

const logger = createLogger('validateMessage');

export default function validateMessage(msg, metadata) {
  logger.setMetadata(metadata);
  logger.debug('Validating message.');

  // Check if message structure is valid
  if (!msg.target) {
    logger.info('Invalid Message from client, missing required field "target". Message is not valid.');
    throw new InvalidRequestFormat('Missing required field "target" in request message.');
  }
  if (typeof msg.target !== 'string') {
    logger.info('Invalid Message from client, field "target" is not a string.');
    throw new InvalidRequestFormat('Field "target" must be a string.');
  }

  if (!msg.payload) {
    logger.info('Invalid Message from client, missing required field "payload". Message is not valid.');
    throw new InvalidRequestFormat('Missing required field "payload" in request message.');
  }
  if (typeof msg.payload !== 'object') {
    logger.info('Invalid Message from client, field "payload" is not an object. Message is not valid.');
    throw new InvalidRequestFormat('Field "payload" must be an object.');
  }

  if(msg.metadata){
    if(msg.metadata.userReqId && typeof msg.metadata.userReqId !== 'string'){
      logger.info('Field userReqId is not a string. Message is not valid.');
      throw new InvalidRequestFormat('Field userReqId in metadata must be a string.');
    }
  }

  msg.metadata.serverSideReqId = metadata.requestId;
  logger.debug('Message successfuly validated.');

  return true;
}
