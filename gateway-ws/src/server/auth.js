import { validateJWT } from '@meshplaylab/shared/src/utils/validateJWT.js';
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { AuthenticationError } from '../constants/errors.js';

/**
 * 
 * @param {*} payload 
 * @param {import('../config/logger.js').SocketLoggerMetadata} metadata
 * 
 * @returns 
 */
export async function authenticateConnection(payload, metadata) {

    const logger = createLogger('auth.authenticateConnection');
    logger.setMetadata(metadata);

    if (!payload.token) {

        logger.info('User message is missing the JWT, could not authenticate.');
        throw new AuthenticationError('Missing JWT in payload.');

    }

    const token = payload.token;
    let decoded;
    try {

        logger.debug('Decoding JWT...');
        decoded = await validateJWT(token, metadata);
        logger.debug('JWT decoded successfully.');

    } catch (err) {

        switch (err.name) {
            case 'TokenExpiredError': {
                logger.info('JWT expired, authentication failed.');
                throw new AuthenticationError('Expired JWT.');
            }

            case 'JsonWebTokenError': {
                logger.warn('Decodeding token produced a generic JsonWebTokenError.');
                throw new AuthenticationError('Invalid JWT.');
            }

            case 'UserNotFound', 'UsernamesDontMatch', 'InvalidTokenFormat': {
                logger.info(`JWT validation didn't match database contents:${err.name}`);
                throw new AuthenticationError('Invalid JWT.');
            }

            default: {
                logger.error('Unexpected error while decoding JWT, authentication failed.', '', err);
                throw err;
            }
        }
    }

    logger.info('Connection authenticated successfully.');
    return { id: decoded.id, username: decoded.username };
}