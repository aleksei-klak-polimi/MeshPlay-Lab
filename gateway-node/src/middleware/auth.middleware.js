import { errorResponse } from "../utils/response.js";
import { handleError } from "../utils/errorHandler.js";
import { UnauthorizedError, BadRequestError } from "../utils/errors.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { HttpLoggerMetadata } from "../config/logger.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { validateJWT } from "@meshplaylab/shared/src/utils/validateJWT.js";

const logger = createLogger('auth.middleware');

/**
 * Express middleware that authenticates incoming requests using a JWT token.
 *
 * Validates presence and structure of the `Authorization` header.
 * Extracts the JWT.
 * Calls `validateJWT()` to verify signature, payload structure, and user existence.
 *
 * On success, attaches the decoded token payload to `req.user` and calls `next()`.
 * On failure, responds with an appropriate error JSON.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware callback.
 * 
 * @returns {Promise<void>} - Resolves once the middleware completes.
 */
export async function authenticateToken(req, res, next){

    const metadata = new HttpLoggerMetadata(req.meta.id);
    logger.setMetadata(metadata);
    logger.debug('Authenticating JWT token.', 'authenticateToken');
    const authHeader = req.headers['authorization'];

    if(!authHeader){

        logger.info('Missing Auth Header.', 'authenticateToken');
        const error = new UnauthorizedError('Access denied. Missing Auth Header.', ERROR_CODES.MISSING_AUTH_HEADER);
        return errorResponse(req, res, error);

    }

    const token = authHeader.split(' ')[1];

    if(!token){

        logger.info('Missing JWT in Auth Header.', 'authenticateToken');
        const error = new UnauthorizedError('Access denied. Token missing.', ERROR_CODES.MISSING_JWT);
        return errorResponse(req, res, error);

    }


    //Decode user data from jwt
    let decoded

    try{

        decoded = await validateJWT(token, metadata);

    } catch ( err ) {

        switch (err.name) {

            case 'TokenExpiredError':{

                logger.info(`Provided JWT has expired`, 'authenticateToken');
                const error = new UnauthorizedError('Access denied. Token expired.', ERROR_CODES.EXPIRED_JWT);
                return errorResponse(req, res, error);
                
            }

            case 'JsonWebTokenError':{

                logger.info(`Error while verifying token.`, 'authenticateToken', err);
                const error = new UnauthorizedError('Access denied. Invalid user token format.', ERROR_CODES.INVALID_JWT_FORMAT);
                return errorResponse(req, res, error);

            }
                
            case 'InvalidTokenFormat':{

                logger.info(`Provided JWT has invalid format.`, 'authenticateToken');
                const error = new BadRequestError('Access denied. Invalid user token format.', ERROR_CODES.INVALID_JWT_FORMAT);
                return errorResponse(req, res, error);

            }

            case 'UserNotFound':{

                logger.info(`Attempted to use JWT of non existing user.`, 'authenticateToken');
                const error = new UnauthorizedError('Access denied. Invalid user token contents.', ERROR_CODES.INVALID_JWT_CONTENT);
                return errorResponse(req, res, error);

            }

            case 'UsernamesDontMatch':{

                logger.info(`Username in JWT does not match username in database`, 'authenticateToken');
                const error = new UnauthorizedError('Access denied. Invalid user token contents.', ERROR_CODES.INVALID_JWT_CONTENT);
                return errorResponse(req, res, error);

            }
        
            default:{

                logger.error(`Error while authenticating user JWT: `, 'authenticateToken', err);
                const sanitizedError = handleError(err);
                if(sanitizedError.status === 500) logger.error(`Error while authenticating user JWT: `, 'authenticateToken', err);
                else logger.info(`JWT Authentication failed.`, 'authenticateToken');
                return errorResponse(req, res, sanitizedError);

            }
        }
    }
    
    req.user = decoded;
    next();
}