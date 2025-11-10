import { getConnection } from "../config/db.js";
import config from '../config/config.js';
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

export async function authenticateToken(req, res, next){
    logger.debug('Authenticating JWT token.', 'authenticateToken');

    const authHeader = req.headers['authorization'];

    if(!authHeader){
        logger.debug('Missing Auth Header.', 'authenticateToken');
        const error = new BadRequestError('Access denied. Missing Auth Header.', 'MISSING_AUTH_HEADER');
        return handleError(error, res);
    }

    const token = authHeader.split(' ')[1];

    if(!token){
        logger.debug('Missing JWT in Auth Header.', 'authenticateToken');
        const error = new UnauthorizedError('Access denied. Token missing.', 'MISSING_JWT');
        return handleError(error, res);
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
                return handleError(error, res);
            }
            logger.warn(`Error while verifying token: ${err.name} ${err.message}`, 'authenticateToken');
            const error = new BadRequestError('Access denied. Invalid token.', 'INVALID_JWT');
            return handleError(error, res);
        }

        //Check if user data is correctly formatted
        const {error: validationError} = tokenSchema.validate(decoded);
        if (validationError){
            logger.warn(`Provided JWT has invalid format.`, 'authenticateToken');
            const error = new UnauthorizedError('Access denied. Invalid user token format.', 'INVALID_JWT_FORMAT');
            return handleError(error, res);
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
                return handleError(error, res);
            }
            //Check if username matches
            else if(dbUserData.username != decoded.username){
                logger.warn(`Username in JWT does not match username in database`, 'authenticateToken');
                const error = new UnauthorizedError('Access denied. Invalid user token contents.', 'INVALID_JWT_CONTENT');
                return handleError(error, res);
            }
        } 
        //Handle db access errors
        catch (err) {
            logger.error(`Error while authenticating user JWT: `, 'authenticateToken', err);
            return handleError(err, res);
        } finally {
            if (conn) await conn.release();
        }

        req.user = decoded;
        next();

    } catch (err){
        logger.error(`Error while authenticating user JWT: `, 'authenticateToken', err);
        return handleError(err, res);
    }
}