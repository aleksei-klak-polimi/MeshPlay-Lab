import { validateJWT } from '@meshplaylab/shared/src/utils/validateJWT.js';
import { randomUUID } from "crypto";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { SocketLoggerMetadata } from '../config/logger.js';

const logger = createLogger('auth.middleware');

/**
 * Handles authentication for WebSocket upgrade requests.
 *
 * This middleware intercepts incoming HTTP `Upgrade` requests, validates 
 * the Authorization header, verifies the provided JWT, and on success 
 * upgrades the connection to a WebSocket by delegating to `wss.handleUpgrade()`.
 *
 * On failure, the connection is rejected with the appropriate HTTP status code.
 *
 * Expected JWT format in the Authorization header:
 *    `Authorization: Bearer <token>`
 *
 * @async
 * @param {import('http').IncomingMessage} req - The incoming HTTP request object sent during WebSocket upgrade.
 * @param {import('net').Socket} socket - The raw network socket used for the upgrade handshake.
 * @param {Buffer} head - The first packet of the upgraded stream; usually unused.
 * @param {import('ws').WebSocketServer} wss - The WebSocket server instance responsible for managing connections.
 *
 * @returns {Promise<void>} Resolves when the request is either upgraded or rejected.
 */
export default async function (req, socket, head, wss) {
    try {

        const requestId = randomUUID();
        const logMeta = new SocketLoggerMetadata(null, requestId);
        logger.setMetadata(logMeta);

        logger.debug(`Received new authentication request from ip: ${socket.remoteAddress}`);

        const authHeader = req.headers['authorization'];

        if (!authHeader) {

            logger.info('Missing Auth Header.');
            handleError(401, 'Missing Auth Header', socket);
            return;

        }

        const token = authHeader.split(' ')[1];

        if (!token) {

            logger.info('Missing JWT in Auth Header.');
            handleError(401, 'Missing JWT in Auth Header.', socket);
            return;

        }

        //Decode user data from jwt
        let decoded

        logger.debug('Decoding JWT.');
        try { decoded = await validateJWT(token, logMeta); }
        catch (err) {

            handleJWTError(err, socket);
            return;

        }

        logger.debug('Client authenticated successfully, upgrading connection.');

        wss.handleUpgrade(req, socket, head, function (ws) {
            ws.user = decoded;
            wss.emit('connection', ws, req);
        });


    } catch (err) {

        logger.error('Unexpected error while authenticating connection.', '', err);
        handleError(500, 'Internal error', socket);

    }
}


// Helper functions
function handleError(code, message, socket) {
    socket.write(`HTTP/1.1 ${code} ${message}\r\n\r\n`);
    socket.destroy();
    return;
}

function handleJWTError(err, socket) {
    switch (err.name) {

        case 'TokenExpiredError': {

            logger.info(`Provided JWT has expired`);
            handleError(401, 'JWT Expired', socket);

        }

        case 'JsonWebTokenError': {

            logger.info(`Error while verifying token.`, '', err);
            handleError(401, 'Invalid JWT', socket);

        }

        case 'InvalidTokenFormat': {

            logger.info(`Provided JWT has invalid format.`);
            handleError(401, 'Invalid JWT format', socket);

        }

        case 'UserNotFound': {

            logger.info(`Attempted to use JWT of non existing user.`);
            handleError(401, 'Invalid JWT contents', socket);

        }

        case 'UsernamesDontMatch': {

            logger.info(`Username in JWT does not match username in database.`);
            handleError(401, 'Invalid JWT contents', socket);

        }

        default: {

            logger.error(`Error while authenticating user JWT: `, '', err);
            handleError(500, 'Internal error', socket);

        }
    }
}