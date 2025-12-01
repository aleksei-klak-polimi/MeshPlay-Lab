import { InvalidMessageFormat } from "../constants/errors.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

const logger = createLogger('parseMessage.parse');

export default function parse(rawMessage, loggerMeta) {
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