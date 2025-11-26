import config from "../config/config.js";
import UserModel from "../models/user.model.js";
import { getConnection } from "../config/db.js";
import jwt from "jsonwebtoken";
import Joi from 'joi';
import { id, iat, exp, username } from '../schemas/fields.js';
import { createLogger } from "../config/logger.js";

const logger = createLogger('shared.node.utils.validateJWT');

const tokenSchema = Joi.object({
    id: id.required(),
    iat: iat.required(),
    exp: exp.required(),
    username: username.required()
});

/**
 * Validates and decodes a JWT.
 *
 * Responsibilities handled by this function:
 * - Verify JWT signature using the configured secret.
 * - Verify token structure against Joi schema.
 * - Confirm that the referenced user exists in the database.
 * - Confirm that username in the token matches the stored username.
 *
 * This function does **not** send responses — it throws errors.
 *
 * @param {string} token      - The JWT string extracted from the Authorization header.
 * @param {{ toString: function(): string }} metadata - Metadata for logging including for example requestID.
 *
 * @returns {Promise<Object>} The decoded JWT payload if validation succeeds.
 *
 * @throws {Error} With one of the following `.name` values:
 *   - **TokenExpiredError** — JWT verification indicates expiration.
 *   - **JsonWebTokenError** — JWT verification failed for other reasons.
 *   - **InvalidTokenFormat** — Token payload does not match required schema.
 *   - **UserNotFound** — Token references a user that does not exist.
 *   - **UsernamesDontMatch** — Token username does not match DB username.
 * 
 * @throws {*}                 Any other error thrown by validateJWT() or db connection.
 */
export async function validateJWT (token, metadata) {
    logger.setMetadata(metadata);

    logger.debug('Decoding JWT.', 'validateJWT');
    
    let decoded;
    try { decoded = jwt.verify(token, config.jwtSecret) }
    catch (err) { throw err; }

    //Check if user data is correctly formatted
    logger.debug('Checking JWT fields formatting.', 'validateJWT');
    const { error: validationError } = tokenSchema.validate(decoded);

    if (validationError) {

        //const error = new BadRequestError('Access denied. Invalid user token format.', ERROR_CODES.INVALID_JWT_FORMAT);
        logger.debug('Invalid JWT formatting.', 'validateJWT');
        const error = new Error();
        error.name = 'InvalidTokenFormat';
        throw error;

    }

    //Check if user data matches to database
    let conn;
    try {

        //Check if user exists
        logger.debug('Retreiving user from db.', 'validateJWT');
        conn = await getConnection();
        const dbUserData = await UserModel.getById(conn, decoded.id, metadata);

        if (!dbUserData) {

            //const error = new UnauthorizedError('Access denied. Invalid user token contents.', ERROR_CODES.INVALID_JWT_CONTENT);
            logger.debug('No user found.', 'validateJWT');
            const error = new Error();
            error.name = 'UserNotFound';
            throw error;

        }
        //Check if username matches
        else if (dbUserData.username != decoded.username) {

            //const error = new UnauthorizedError('Access denied. Invalid user token contents.', ERROR_CODES.INVALID_JWT_CONTENT);
            logger.debug('Usernames don\'t match.', 'validateJWT');
            const error = new Error();
            error.name = 'UsernamesDontMatch';
            throw error;

        }

        logger.debug('JWT validated without problems.', 'validateJWT');
        return decoded;

    } finally {

        if (conn) await conn.release();

    }
}