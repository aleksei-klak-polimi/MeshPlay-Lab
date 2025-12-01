import { InvalidMessageFormat } from "../constants/errors.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

const logger = createLogger('validateMessage');

export default function validate(message, requestId, loggerMeta) {
  logger.setMetadata(loggerMeta);
  logger.debug('Validating message.');

  // Check if message structure is valid
  if (!message.target) {
    logger.debug('Invalid Message from client, missing required field "target". Message is not valid.');
    throw new InvalidMessageFormat('Missing required field "target" in request message.');
  }
  if (typeof message.target !== 'string') {
    logger.debug('Invalid Message from client, field "target" is not a string.');
    throw new InvalidMessageFormat('Field "target" must be a string.');
  }

  if (!message.payload) {
    logger.debug('Invalid Message from client, missing required field "payload". Message is not valid.');
    throw new InvalidMessageFormat('Missing required field "payload" in request message.');
  }
  if (typeof message.payload !== 'object') {
    logger.debug('Invalid Message from client, field "payload" is not an object. Message is not valid.');
    throw new InvalidMessageFormat('Field "payload" must be an object.');
  }

  if(!message.metadata) {
    logger.debug('Invalid Message from client, missing required field "metadata". Message is not valid.');
    throw new InvalidMessageFormat('Missing required field "metadata" in request message.');
  }
  if (typeof message.metadata !== 'object') {
    logger.debug('Invalid Message from client, field "metadata" is not an object. Message is not valid.');
    throw new InvalidMessageFormat('Field "metadata" must be an object.');
  }

  if(!message.metadata.userReqId){
    logger.debug('Invalid Message from client, missing required field "metadata.userReqId". Message is not valid.');
    throw new InvalidMessageFormat('Missing required field "metadata.userReqId" in request message.');
  }

  if(typeof message.metadata.userReqId !== 'string'){
    logger.debug('Field metadata.userReqId is not a string. Message is not valid.');
    throw new InvalidMessageFormat('Field metadata.userReqId in metadata must be a string.');
  }

  message.metadata.serverSideReqId = requestId;
  logger.debug('Message successfuly validated.');

  return true;
}
