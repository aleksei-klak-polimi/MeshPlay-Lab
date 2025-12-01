import parse from "../utils/parseMessage.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { sanitizeError } from "../utils/errorSanitizer.js";
import { errorResponse } from "../utils/response.js";

const logger = createLogger('parse.middleware');

export default function (socket, rawMessage, closeOnFail, loggerMeta){
    logger.setMetadata(loggerMeta);

    try{

        const parsed = parse(rawMessage, loggerMeta);
        return parsed;

    } catch (err){

        logger.info('Message parsing failed.');
        const sanitized = sanitizeError(err, 'Unexpected error while parsing the message.', loggerMeta);
        errorResponse(socket, 'server', sanitized, loggerMeta);

        if(closeOnFail){
            logger.info('Closing connection.');
            socket.terminate();
        }

        return false; // Returning false to signal error handled.

    }
}