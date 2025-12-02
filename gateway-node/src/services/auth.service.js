/**
 *AuthService — Handles user signup and authentication logic.
 */

import { getConnection } from "@meshplaylab/shared/src/config/db.js";
import UserModel from "@meshplaylab/shared/src/models/user.model.js";
import { hashPassword, validatePassword } from '../utils/hashPassword.js';
import sign from "@meshplaylab/shared/src/utils/generateJWT.js";
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { ERROR_CODES } from '../constants/errorCodes.js';

const logger = createLogger('auth.service');

const AuthService = {

    /**
     * Create a new user account.
     *
     * @param {Object} data - User creation payload.
     * @param {string} data.username - Username to register.
     * @param {string} data.password - Raw password to hash.
     * @param {{ toString: function(): string }} metadata - Metadata for logging including for example requestID.
     * 
     * @returns {Promise<Object>} The newly created user (without passwordHash).
     * 
     * @throws {ConflictError} If the username already exists.
     * @throws {Error} For database or hashing errors.
     */
    async create({username, password}, metadata){

        logger.setMetadata(metadata);
        const createdAt = new Date();
        const passwordHash = await hashPassword(password);

        let conn;

        try{

            conn = await getConnection();
            await conn.beginTransaction();

            //Check if user already exists
            logger.debug(`Checking for existing user: ${username}`, 'create');
            const existingUser = await UserModel.getByUsername(conn, username, metadata);
            if(existingUser){

                logger.info(`Signup attempt with existing username: ${username}`, 'create');
                throw new ConflictError('Username already exists', ERROR_CODES.USER_EXISTS);

            }

            //Create new user
            const userId = await UserModel.create(conn, {username, passwordHash, createdAt}, metadata);
            const createdUser = await UserModel.getById(conn, userId, metadata);
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
     * @param {string} username - Username attempting login.
     * @param {string} password - Raw password to validate.
     * @param {{ toString: function(): string }} metadata - Metadata for logging including for example requestID.
     * 
     * @returns {Promise<string>} JWT token for authenticated session.
     * 
     * @throws {UnauthorizedError} If credentials are invalid.
     * @throws {Error} For database or internal errors.
     */
    async authenticate (username, password, metadata){

        logger.setMetadata(metadata);
        const lastLogin = new Date();
        let conn

        try{

            conn = await getConnection();
            await conn.beginTransaction();

            //Check if user exists
            logger.debug(`Checking if user exists: ${username}`, 'authenticate');
            const existingUser = await UserModel.getByUsername(conn, username, metadata);
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
            const token = sign(existingUser.id, existingUser.username);

            //Updating user last login
            logger.debug(`Updating last login for user: ${username}`, 'authenticate');
            await UserModel.update(conn, existingUser.id, {lastLogin}, metadata);

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