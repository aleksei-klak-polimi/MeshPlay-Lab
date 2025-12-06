/**
 * @typedef {Object} ClientMessage
 * @property {string} target - Handler target (e.g., "chat", "game").
 * @property {Object} payload - Client-sent payload.
 * @property {Object} metadata - Metadata object.
 * @property {string} metadata.userReqId - Client-generated request ID.
 */

/**
 * @typedef {Object} RedisUpdateStatus
 * @property {number} code
 * @property {"ok"|"error"} severity
 * @property {string} message
 */

import { InvalidMessageFormat } from "../constants/errors.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';


/**
 * Validates the structure of a message received directly from a WebSocket client.
 *
 * Expected structure:
 * ```
 * {
 *   target: string,
 *   payload: object,
 *   metadata: {
 *     userReqId: string
 *   }
 * }
 * ```
 *
 * If any required field is missing or has the wrong type, the validator throws
 * {@link InvalidMessageFormat}. All validation failures are logged.
 *
 * @param {ClientMessage} message - Parsed message from the client.
 * @param {{ toString(): string }} loggerMeta - Metadata used for contextual logging (typically `SocketLoggerMetadata`).
 *
 * @throws {InvalidMessageFormat} When message is structurally invalid.
 *
 * @returns {true} When validation succeeds.
 */
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




/**
 * Validates the structure of a message coming from Redis.
 *
 * Expected overall structure:
 * ```
 * {
 *   userId: string,
 *   message: {
 *     type: "event" | "update",
 *     source: string,
 *
 *     // If type === "event"
 *     payload?: object,
 *
 *     // If type === "update"
 *     status?: RedisUpdateStatus,
 *     metadata?: {
 *       clientSideReqId: string|null,
 *       serverSideReqId: string|null
 *     }
 *   }
 * }
 * ```
 *
 * Validation ensures that backend services produce well-formed protocol messages
 * before they are wrapped into response frames and delivered to clients.
 *
 * @param {Object} redisMessage
 * @param {string} redisMessage.userId
 * @param {Object} redisMessage.message
 *
 * @throws {InvalidMessageFormat} If any field is malformed or `type` is unknown.
 *
 * @returns {true}
 */
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