import { InvalidMessageFormat } from "../../constants/errors.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

/**
 * Parses a raw incoming WebSocket message into a JavaScript object.
 *
 * This function guarantees:
 * - The input is valid JSON.
 * - Any JSON parsing failure is converted into an {@link InvalidMessageFormat} error.
 *
 * @param {string} rawMessage - Raw message received from a WebSocket client.
 * @param {{ toString(): string }} loggerMeta - Metadata used for contextual logging (typically `SocketLoggerMetadata`).
 *
 * @throws {InvalidMessageFormat} If the message is not valid JSON.
 *
 * @returns {Object} Parsed JSON message.
 */
export default function parse(rawMessage, loggerMeta) {
    const logger = createLogger('parseMessage.parse');
    logger.setMetadata(loggerMeta);

    // Check if message has valid JSON
    try {
        const parsed = JSON.parse(rawMessage);
        return parsed;
    }
    catch (err) {
        logger.debug('Error while parsing message JSON.');
        throw new InvalidMessageFormat('Invalid JSON format in the request.');
    }
}