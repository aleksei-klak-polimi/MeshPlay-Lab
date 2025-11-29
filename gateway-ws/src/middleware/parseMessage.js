import { InvalidRequestFormat } from "../constants/errors.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

const logger = createLogger('parseMessage.parse')

export default function parse(message, metadata) {

    let parsed;

    // Check if message has valid JSON
    try { parsed = JSON.parse(message); }
    catch (err) {
        logger.debug('Error while parsing message JSON.');
        throw new InvalidRequestFormat('Invalid JSON format in the request.');
    }

    return parsed;
}