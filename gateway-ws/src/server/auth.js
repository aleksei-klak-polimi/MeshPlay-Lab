import { validateJWT } from '@meshplaylab/shared/src/utils/validateJWT.js';
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';

export async function authenticateConnection(message, socket, metadata) {

    const logger = createLogger('auth.authenticateConnection');
    logger.setMetadata(metadata);

    // First message expected is the JWT for authentication, if no valid JWT is provided
    // then return error and close the connection, otherwise switch to the authenticated function.
    try {
        let msg;
        try {
            msg = JSON.parse(message);
        } catch (err) {

            logger.info('User provided Invalid JSON, terminating connection.');
            socket.terminate();
            return;
        }

        const token = msg.token;
        if (!token) {

            logger.info('User message is missing the JWT, terminating connection.');
            socket.terminate();
            return;
        }

        let decoded;
        try {

            logger.debug('Decoding JWT...');
            decoded = await validateJWT(token, metadata);
            logger.debug('JWT decoded successfully.');

        } catch (err) {

            logger.info('invalid JWT, terminating connection.');
            socket.terminate();
            return;

        }

        socket.user = { id: decoded.id, username: decoded.username };
        logger.info('Connection authenticated successfully.');

    } catch (err) {

        logger.error(`Unexpected error while authenticating user, terminating connection.`, '', err);
        socket.terminate();

    }
}