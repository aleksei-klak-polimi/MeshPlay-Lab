import { getConnection } from '../config/db.js';
import UserModel from '../models/user.model.js';
import { createLogger } from "../config/logger.js";
import { ERROR_CODES } from '../constants/errorCodes.js';
import { NotFoundError } from '../utils/errors.js';

const logger = createLogger('user.service');

const UserService = {
    async get(id){

        let conn;
        try{

            conn = await getConnection();
            await conn.beginTransaction();

            logger.debug(`Getting user information by id: ${id}.`, 'get');
            const user = await UserModel.getById(conn, id);

            if(!user){
                logger.debug(`No user found by id: ${id}.`, 'get');
                throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);
            }

            logger.debug(`User by id: ${id} found.`, 'get');
            logger.trace(`User contents: ${user}`, 'get');

            delete user.passwordHash;

            return user;

        } catch(err) {

            // Rollback if anything goes wrong
            if (conn) await conn.rollback();
            logger.error(`Failed to get user by id: ${id}`, 'get');
            throw err;

        } finally {

            if (conn) conn.release();

        }
    }
};

export default UserService;