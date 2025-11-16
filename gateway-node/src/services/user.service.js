import { getConnection } from '../config/db.js';
import UserModel from '../models/user.model.js';
import { createLogger } from "../config/logger.js";
import { ERROR_CODES } from '../constants/errorCodes.js';
import { NotFoundError, ForbiddenError, InternalError } from '../utils/errors.js';

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
    },

    async delete(id, user){

        let conn;
        try{

            conn = await getConnection();
            await conn.beginTransaction();

            //Check if requesting user has permissions to delete
            if(id !== user.id){
                logger.warn(`User by id: ${user.id} attempted to delete user by id: ${id}`);
                throw new ForbiddenError();
            }

            //Check if user to delete exists
            const userToDelete = await UserModel.getById(conn, id);
            if(!userToDelete){
                logger.warn(`Received request to delete non existing userId: ${id}`, 'delete');
                return;
            }
            logger.debug(`User by id: ${id} found.`, 'delete');
            logger.trace(`User contents: ${user}`, 'delete');

            //Delete the user
            logger.debug(`Deleting user by id: ${id}.`, 'delete');
            await UserModel.delete(conn, id);

        } catch(err) {

            // Rollback if anything goes wrong
            if (conn) await conn.rollback();
            logger.error(`Failed to delete user by id: ${id}`, 'delete');
            throw err;

        } finally {

            if (conn) conn.release();

        }
    }
};

export default UserService;