import { InternalError } from "../constants/errors.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

const logger = createLogger('errorSanitizer');

export function sanitizeError(error, message, loggerMeta){
    logger.setMetadata(loggerMeta);

    if(!error.isAppError){
        logger.error(null, null, error);
        return new InternalError(message);
    }
    else
        return error;
}