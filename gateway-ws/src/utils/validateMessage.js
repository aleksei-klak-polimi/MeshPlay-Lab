import { InvalidMessageFormat } from "../constants/errors.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';


// Client messages validator
export function validateClient(message, loggerMeta) {
  const logger = createLogger('validateMessage.validateClient');

  logger.setMetadata(loggerMeta);
  logger.debug('Validating client message.');

  // Check if message structure is valid
  validateFieldAndType(message.target, 'target', 'string', logger);
  validateFieldAndType(message.payload, 'payload', 'object', logger);
  validateFieldAndType(message.metadata, 'metadata', 'object', logger);
  validateFieldAndType(message.metadata.userReqId, 'metadata.userReqId', 'string', logger);

  logger.debug('Message successfuly validated.');

  return true;
}




// Redis messages validators
export function validateRedis({userId, message}){
  const logger = createLogger('validateMessage.validateRedis');

  logger.debug('Validating redis message.');

  validateFieldAndType(userId, 'userId', 'string', logger);
  validateFieldAndType(message, 'message', 'object', logger);
  validateFieldAndType(message.source, 'source', 'string', logger);
  validateFieldAndType(message.type, 'type', 'string', logger);

  switch (message.type) {
    case 'event':
      return validateRedisEvent(message);

    case 'update':
      return validateRedisUpdate(message);
  
    default: {
      const error = new InvalidMessageFormat(`Unknown "type" in redis message: ${message.type}.`);
      logger.error(`Unknown "type" in redis message: ${message.type}. Message is not valid.`);
      throw error;
    }
  }
}

function validateRedisEvent(message){
  const logger = createLogger('validateMessage.validateRedisEvent');

  logger.debug('Detected message type: "event".');

  validateFieldAndType(message.payload, 'payload', 'object', logger);

  return true;
}

function validateRedisUpdate(message){
  const logger = createLogger('validateMessage.validateRedisUpdate');

  logger.debug('Detected message type: "update".');

  validateFieldAndType(message.status, 'status', 'object', logger);
  validateFieldAndType(message.metadata, 'metadata', 'object', logger);

  return true;
}




// Helper function
function validateFieldAndType(field, fieldName, type, logger){
  if(!field){
    const error = new InvalidMessageFormat(`Missing required field "${fieldName}" in message.`);
    logger.info(`Invalid Message, missing required field "${fieldName}". Message is not valid.`);
    throw error;
  }

  if(typeof field !== type){
    const error = new InvalidMessageFormat(`Field "${fieldName}" in message is not ${type}.`);
    logger.info(`Field "${fieldName}" in message is not ${type}. Message is not valid.`);
    throw error;
  }
}