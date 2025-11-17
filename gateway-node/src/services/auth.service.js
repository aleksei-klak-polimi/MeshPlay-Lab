/**
 *AuthService — Handles user signup and authentication logic.
 */

import { getConnection } from '../config/db.js';
import UserModel from '../models/user.model.js';
import { hashPassword, validatePassword } from '../utils/hashPassword.js';
import jwt from 'jsonwebtoken';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import config from '../config/config.js';
import { createLogger } from "../config/logger.js";
import { ERROR_CODES } from '../constants/errorCodes.js';

const logger = createLogger('auth.service');

const AuthService = {

    /**
     * Create a new user account.
     *
     * @param {string} requestId - Request identifier for logging.
     * @param {Object} data - User creation payload.
     * @param {string} data.username - Username to register.
     * @param {string} data.password - Raw password to hash.
     * 
     * @returns {Promise<Object>} The newly created user (without passwordHash).
     * 
     * @throws {ConflictError} If the username already exists.
     * @throws {Error} For database or hashing errors.
     */
    async create(requestId, {username, password}){

        logger.setRequestId(requestId);
        const createdAt = new Date();
        const passwordHash = await hashPassword(password);

        let conn;

        try{

            conn = await getConnection();
            await conn.beginTransaction();

            //Check if user already exists
            logger.debug(`Checking for existing user: ${username}`, 'create');
            const existingUser = await UserModel.getByUsername(requestId, conn, username);
            if(existingUser){

                logger.info(`Signup attempt with existing username: ${username}`, 'create');
                throw new ConflictError('Username already exists', ERROR_CODES.USER_EXISTS);

            }

            //Create new user
            const userId = await UserModel.create(requestId, conn, {username, passwordHash, createdAt});
            const createdUser = await UserModel.getById(requestId, conn, userId);
            delete createdUser.passwordHash;

            //Commit transaction
            await conn.commit();
            logger.info(`New user created: ${createdUser}`, 'create');
            return createdUser;

        } catch (err){

            // Rollback if anything goes wrong
            if (conn) await conn.rollback();
            if(!err.isAppError || err.status === 500) logger.error(`Failed to create user: ${username}`, 'create');
            else logger.info(`Refused to create user: ${username}`, 'create');
            throw err;
            
        } finally {

            if (conn) await conn.release();

        }
    },

    /**
     * Authenticate a user and generate a JWT.
     *
     * @param {string} requestId - Request identifier for logging.
     * @param {string} username - Username attempting login.
     * @param {string} password - Raw password to validate.
     * 
     * @returns {Promise<string>} JWT token for authenticated session.
     * 
     * @throws {UnauthorizedError} If credentials are invalid.
     * @throws {Error} For database or internal errors.
     */
    async authenticate (requestId, username, password){

        logger.setRequestId(requestId);
        const lastLogin = new Date();
        let conn

        try{

            conn = await getConnection();
            await conn.beginTransaction();

            //Check if user exists
            logger.debug(`Checking if user exists: ${username}`, 'authenticate');
            const existingUser = await UserModel.getByUsername(requestId, conn, username);
            if(!existingUser){

                logger.info(`Login attempt with non-existing username: ${username}`, 'authenticate');
                throw new UnauthorizedError('Wrong username or password', ERROR_CODES.INVALID_CREDENTIALS);

            }
            logger.debug(`User exists: ${username}`, 'authenticate');

            //Check password
            logger.debug(`Checking password hash for user: ${username}`, 'authenticate');
            if(!(await validatePassword(password, existingUser.passwordHash))){

                logger.info(`Login attempt for user: ${username} with invalid password.`, 'authenticate');
                throw new UnauthorizedError('Wrong username or password', ERROR_CODES.INVALID_CREDENTIALS);

            }

            //Generate JWST
            logger.debug(`Generating token for user: ${username}`, 'authenticate');
            const token = jwt.sign(
                {id: existingUser.id, username: existingUser.username},
                config.jwtSecret,
                {expiresIn: config.jwtExpiration}
            );

            //Updating user last login
            logger.debug(`Updating last login for user: ${username}`, 'authenticate');
            await UserModel.update(requestId, conn, existingUser.id, {lastLogin});

            //Commit transaction
            await conn.commit();
            logger.info(`Returning login token for user: ${username}`, 'authenticate');
            return token;

        } catch (err) {

            // Rollback if anything goes wrong
            if (conn) await conn.rollback();
            if(!err.isAppError || err.status === 500) logger.error(`Failed to authenticate user: ${username}`, 'authenticate');
            else logger.info(`Refused to authenticate user: ${username}`, 'authenticate');
            throw err;

        } finally {

            if (conn) await conn.release();

        }

    }
};

export default AuthService;