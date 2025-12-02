import auth from '../utils/auth.js';
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { AuthenticationError, InvalidMessageFormat } from '../constants/errors.js';
import { sanitizeError } from "../utils/errorSanitizer.js";
import { errorResponse, successResponse } from "../utils/response.js";
import codes from "../protocol/status/codes.js";

const logger = createLogger('auth.middleware');

export default async function (socket, message, closeOnFail, loggerMeta) {
    logger.setMetadata(loggerMeta);

    try {

        // Check if message is for authentication.
        if (message.target !== 'auth') {
            logger.debug('Received message not adressed to auth.');
            throw new AuthenticationError('Expecting Auth message.');
        }

        // Check if message contains token.
        if(!message.payload.token){
            logger.debug('Received message is missing the "token" field in the payload.');
            throw new InvalidMessageFormat('Auth message missing "token" field in payload.');
        }

        if(typeof message.payload.token !== 'string') {
            logger.debug('Received message field "token" is not a string.');
            throw new InvalidMessageFormat('Auth message invalid "token" field format in payload.');
        }

        // Validate the JWT in message payload.
        socket.user = await auth(message.payload.token, loggerMeta);
        successResponse(socket, 'auth', codes.AUTH_SUCCESS, 'Authenticated successfully.', loggerMeta, message.metadata);
        return true;

    } catch (err) {

        logger.info('Authentication failed.');
        const sanitized = sanitizeError(err, 'Unexpected error while authenticating connection.', loggerMeta);
        errorResponse(socket, 'auth', sanitized, loggerMeta);

        if (closeOnFail) {
            logger.info('Closing connection.');
            socket.terminate();
        }

        return false; // Returning false to signal error handled.

    }
}