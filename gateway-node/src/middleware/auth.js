import { getConnection } from "../config/db.js";
import config from '../config/config.js';
import { errorResponse } from "../utils/response.js";
import { handleError } from "../utils/errorHandler.js";
import { UnauthorizedError, BadRequestError } from "../utils/errors.js";
import UserModel from "../models/user.model.js";
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import { id, iat, exp, username } from '../schemas/fields.js';
import { createLogger } from "../config/logger.js";

const logger = createLogger('middleware.auth');

const tokenSchema = Joi.object({
    id: id.required(),
    iat: iat.required(),
    exp: exp.required(),
    username: username.required()
});


/**
 * Express middleware that authenticates incoming requests using a JWT token.
 *
 * Validates the presence and format of the `Authorization` header,
 * verifies the token signature, checks the token’s payload structure,
 * and ensures the user exists and matches in the database.
 *
 * On success, attaches the decoded token payload to `req.user` and calls `next()`.
 * On failure, responds with an appropriate error JSON.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware callback.
 * @returns {Promise<void>} - Resolves once the middleware completes.
 */
export async function authenticateToken(req, res, next){
    logger.debug('Authenticating JWT token.', 'authenticateToken');

    const authHeader = req.headers['authorization'];

    if(!authHeader){
        logger.debug('Missing Auth Header.', 'authenticateToken');
        const error = new UnauthorizedError('Access denied. Missing Auth Header.', 'MISSING_AUTH_HEADER');
        return errorResponse(res, error);
    }

    const token = authHeader.split(' ')[1];

    if(!token){
        logger.debug('Missing JWT in Auth Header.', 'authenticateToken');
        const error = new UnauthorizedError('Access denied. Token missing.', 'MISSING_JWT');
        return errorResponse(res, error);
    }

    try{
        //Decode user data from jwt
        let decoded;
        try{
            decoded = jwt.verify(token, config.jwtSecret);
            logger.trace(`JWT contents:\n${decoded}`);
        } catch (err){
            if (err.name === 'TokenExpiredError') {
                logger.warn(`Provided JWT has expired`, 'authenticateToken');
                const error = new UnauthorizedError('Access denied. Token expired.', 'EXPIRED_JWT');
                return errorResponse(res, error);
            }
            logger.warn(`Error while verifying token: ${err.name} ${err.message}`, 'authenticateToken');
            const error = new UnauthorizedError('Access denied. Invalid token.', 'INVALID_JWT');
            return errorResponse(res, error);
        }

        //Check if user data is correctly formatted
        const {error: validationError} = tokenSchema.validate(decoded);
        if (validationError){
            logger.warn(`Provided JWT has invalid format.`, 'authenticateToken');
            const error = new BadRequestError('Access denied. Invalid user token format.', 'INVALID_JWT_FORMAT');
            return errorResponse(res, error);
        }

        //Check if user data matches to database
        let conn;
        try{
            //Check if user exists
            conn = await getConnection();

            const dbUserData = await UserModel.getById(conn, decoded.id);
            if(!dbUserData){
                logger.warn(`Attempted to use JWT of non existing user.`, 'authenticateToken');
                const error = new UnauthorizedError('Access denied. Invalid user token contents.', 'INVALID_JWT_CONTENT');
                return errorResponse(res, error);
            }
            //Check if username matches
            else if(dbUserData.username != decoded.username){
                logger.warn(`Username in JWT does not match username in database`, 'authenticateToken');
                const error = new UnauthorizedError('Access denied. Invalid user token contents.', 'INVALID_JWT_CONTENT');
                return errorResponse(res, error);
            }
        } 
        //Handle db access errors
        catch (err) {
            logger.error(`Error while authenticating user JWT: `, 'authenticateToken', err);
            const sanitizedError = handleError(err);
            return errorResponse(res, sanitizedError);

        } finally {
            if (conn) await conn.release();
        }

        req.user = decoded;
        next();

    } catch (err){
        logger.error(`Error while authenticating user JWT: `, 'authenticateToken', err);
        const sanitizedError = handleError(err);
        return errorResponse(res, sanitizedError);
    }
}