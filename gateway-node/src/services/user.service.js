import { getConnection } from '../config/db.js';
import UserModel from '../models/user.model.js';
import { createLogger } from "../config/logger.js";
import { ERROR_CODES } from '../constants/errorCodes.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';

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

        // Check if requesting user has permissions to delete
        if(id !== user.id){
            logger.warn(`User by id: ${user.id} attempted to delete user by id: ${id}`, 'delete');
            throw new ForbiddenError();
        }

        let conn;
        try{

            conn = await getConnection();
            await conn.beginTransaction();

            // Check if user to delete exists
            const userToDelete = await UserModel.getById(conn, id);
            if(!userToDelete){
                logger.warn(`Received request to delete non existing userId: ${id}`, 'delete');
                return;
            }
            logger.debug(`User by id: ${id} found.`, 'delete');
            logger.trace(`User contents: ${user}`, 'delete');

            // Delete the user
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
    },

    async edit(id, user, { newUsername }){

        // Check if requesting user has permissions to edit
        if(id !== user.id){
            logger.warn(`User by id: ${user.id} attempted to edit user by id: ${id}`, 'edit');
            throw new ForbiddenError();
        }

        // Checking if at least one parameter value was provided (in the future there will be a user email 
        // and user profile pic etc...)
        if(!newUsername){
            logger.debug('Called edit user with no parameters to edit', 'edit');
            throw new BadRequestError('No fields were provided for editing');
        }

        let conn;
        try{

            conn = await getConnection();
            await conn.beginTransaction();

            // Check if user to edit exists
            const userToEdit = await UserModel.getById(conn, id);
            if(!userToEdit){
                logger.warn(`Received request to edit non existing userId: ${id}`, 'edit');
                return;
            }
            logger.debug(`User by id: ${id} found.`, 'edit');
            logger.trace(`User contents: ${user}`, 'edit');

            // Edit the user
            logger.debug(`Editing user by id: ${id}.`, 'edit');
            logger.trace(`New username: ${newUsername}`, 'edit');
            await UserModel.update(conn, {username: newUsername});

            //retreive edited user
            const user = await UserModel.getById(conn, id);
            delete user.passwordHash;
            return user;

        } catch(err) {

            // Rollback if anything goes wrong
            if (conn) await conn.rollback();
            logger.error(`Failed to edit user by id: ${id}`, 'edit');
            throw err;

        } finally {

            if (conn) conn.release();

        }

    }
};

export default UserService;