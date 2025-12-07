import handlers from "../handlers/index.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { InvalidTarget } from "../constants/errors.js";

/**
 * Routes a validated client message to the correct handler based on its `target` field.
 *
 * Expected message shape (validated earlier in the pipeline):
 * ```
 * {
 *   target: string,
 *   action: string,
 *   payload: Object,
 *   metadata: {
 *      clientSideReqId: string|null,
 *      serverSideReqId: string|null
 *   }
 * }
 * ```
 *
 * Behavior:
 * - Looks up the corresponding handler in `handlers[target]`
 * - If no handler exists, logs and throws an `InvalidTarget` AppError
 * - Otherwise forwards the message to the handler
 *
 * Handlers receive:
 *   (userId: string, message: object)
 *
 * @param {string} userId - ID of the authenticated user sending the message.
 * @param {Object} message - The parsed and validated client message.
 * @param {{ toString(): string }} loggerMeta - Metadata used for contextual logging (typically `SocketLoggerMetadata`).
 *
 * @throws {InvalidTarget} If no handler exists for the message's `target`.
 */
export default function routeMessage(userId, message, loggerMeta) {
  const logger = createLogger('router.routeMessage');
  logger.setMetadata(loggerMeta);
  logger.debug('Routing message for user.');

  const handler = handlers[message.target];

  if (!handler) {

    logger.info(`No handler found for message target: ${message.target}.`);
    throw new InvalidTarget(`No handler found for message target: ${message.target}.`);
    
  }

  logger.debug('Forwarding message to handler.');
  handler(userId, message);
}
