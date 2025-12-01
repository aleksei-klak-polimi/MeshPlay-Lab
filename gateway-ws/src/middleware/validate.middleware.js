import { validateClient } from "../utils/validateMessage.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { sanitizeError } from "../utils/errorSanitizer.js";
import { errorResponse } from "../utils/response.js";

const logger = createLogger('validate.middleware');

export default function (socket, message, closeOnFail, loggerMeta){
    logger.setMetadata(loggerMeta);

    try{

        validateClient(message, loggerMeta);
        return true;

    } catch (err){

        logger.info('Message validation failed.');
        const sanitized = sanitizeError(err, 'Unexpected error while validating the message.', loggerMeta);
        errorResponse(socket, 'server', sanitized, loggerMeta);

        if(closeOnFail){
            logger.info('Closing connection.');
            socket.terminate();
        }

        return false; // Returning false to signal error handled.
    }
}