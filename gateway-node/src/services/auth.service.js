import { getConnection } from '../config/db.js';
import UserModel from '../models/user.model.js';
import { hashPassword, validatePassword } from '../utils/hashPassword.js';
import jwt from 'jsonwebtoken';
import { ConflictError, UnauthorizedError } from '../utils/errors.js';
import { toMySQLDateTime } from '../utils/time.js';
import config from '../config/config.js';
import { createLogger } from "../config/logger.js";
import { ERROR_CODES } from '../constants/errorCodes.js';

const logger = createLogger('auth.service');

const AuthService = {
    async create(requestId, {username, password}){
        logger.setRequestId(requestId);

        const now = new Date();
        const createdAt = toMySQLDateTime(now);
        const passwordHash = await hashPassword(password);

        let conn;
        try{
            conn = await getConnection();
            await conn.beginTransaction();

            //Check if user already exists
            logger.debug(`Checking for existing user: ${username}`, 'create');
            const existingUser = await UserModel.getByUsername(requestId, conn, username);
            if(existingUser){
                logger.warn(`Signup attempt with existing username: ${username}`, 'create');
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
            logger.error(`Failed to create user: ${username}`, 'create');
            throw err;
            
        } finally {
            if (conn) await conn.release();
        }
    },

    async authenticate (requestId, username, password){
        logger.setRequestId(requestId);
        const lastLogin = toMySQLDateTime();

        let conn
        try{
            conn = await getConnection();
            await conn.beginTransaction();

            //Check if user exists
            logger.debug(`Checking if user exists: ${username}`, 'authenticate');
            const existingUser = await UserModel.getByUsername(requestId, conn, username);
            if(!existingUser){
                logger.warn(`Login attempt with non-existing username: ${username}`, 'authenticate');
                throw new UnauthorizedError('Wrong username or password', ERROR_CODES.INVALID_CREDENTIALS);
            }
            logger.debug(`User exists: ${username}`, 'authenticate');

            //Check password
            logger.debug(`Checking password hash for user: ${username}`, 'authenticate');
            if(!(await validatePassword(password, existingUser.passwordHash))){
                logger.warn(`Login attempt for user: ${username} with invalid password.`, 'authenticate');
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

            logger.debug(`Last login for user: ${username} updated`, 'authenticate');

            return token;

        } catch (err) {
            // Rollback if anything goes wrong
            if (conn) await conn.rollback();
            logger.error(`Failed to authenticate user: ${username}`, 'authenticate');
            throw err;

        } finally {
            if (conn) await conn.release();
        }

    }
};

export default AuthService;