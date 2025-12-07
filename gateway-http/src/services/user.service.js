/**
 * UserService — Business logic for user retrieval, deletion, and updates.
 */

import { getConnection } from "@meshplaylab/shared/src/config/db.js";
import UserModel from "@meshplaylab/shared/src/models/user.model.js";
import { createLogger } from '@meshplaylab/shared/src/config/logger.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { hashPassword } from '../utils/hashPassword.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors.js';

const logger = createLogger('user.service');

const UserService = {

    /**
     * Retrieve a user by ID.
     *
     * @param {number} id - User ID to fetch.
     * @param {{ toString: function(): string }} metadata - Metadata for logging including for example requestID.
     * 
     * @returns {Promise<Object>} User object without passwordHash.
     * 
     * @throws {NotFoundError} If the user does not exist.
     * @throws {Error} For database errors.
     */
    async get(id, metadata){

        logger.setMetadata(metadata);
        let conn;

        try{

            conn = await getConnection();
            logger.debug(`Getting user information by id: ${id}.`, 'get');
            const user = await UserModel.getById(conn, id, metadata);

            if(!user){

                logger.info(`No user found by id: ${id}.`, 'get');
                throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);

            }

            delete user.passwordHash;
            logger.info(`Returning requested user by id: ${id}.`, 'get');
            return user;

        } catch(err) {

            if(!err.isAppError || err.status === 500) logger.error(`Failed to get user by id: ${id}`, 'get');
            else logger.info(`Did not retreive user by id: ${id}`, 'get');
            throw err;

        } finally {

            if (conn) await conn.release();
        
        }
    },

    /**
     * Delete a user by ID.
     *
     * @param {number} id - ID of the user to delete.
     * @param {Object} user - Authenticated user performing the request.
     * @param {{ toString: function(): string }} metadata - Metadata for logging including for example requestID.
     * 
     * @returns {Promise<void>}
     * 
     * @throws {ForbiddenError} If the requesting user attempts to delete another user.
     * @throws {Error} For database or transactional errors.
     */
    async delete(id, user, metadata){

        logger.setMetadata(metadata);
        let conn;

        // Check if requesting user has permissions to delete
        if(id !== user.id){

            logger.info(`User by id: ${user.id} attempted to delete user by id: ${id}`, 'delete');
            throw new ForbiddenError();

        }

        try{

            conn = await getConnection();
            await conn.beginTransaction();
            // Check if user to delete exists
            const userToDelete = await UserModel.getById(conn, id, metadata);

            if(!userToDelete){

                logger.info(`Received request to delete non existing userId: ${id}`, 'delete');
                return;

            }

            logger.debug(`User by id: ${id} found.`, 'delete');
            logger.debug(`Deleting user by id: ${id}.`, 'delete');
            // Delete the user
            await UserModel.delete(conn, id, metadata);
            //Commit transaction
            await conn.commit();
            logger.info(`Deleted user: ${userToDelete}`, 'delete');

        } catch(err) {

            // Rollback if anything goes wrong
            if (conn) await conn.rollback();
            if(!err.isAppError || err.status === 500) logger.error(`Failed to delete user by id: ${id}`, 'delete');
            else logger.info(`Refused to delete user by id: ${id}`, 'delete');
            throw err;

        } finally {

            if (conn) conn.release();

        }
    },

    /**
     * Edit the username and/or password of a user.
     *
     * @param {number} id - ID of the user to edit.
     * @param {Object} user - Authenticated user performing the operation.
     * @param {Object} data - Fields to update.
     * @param {string} [data.newUsername] - New username.
     * @param {string} [data.newPassword] - New raw password.
     * @param {{ toString: function(): string }} metadata - Metadata for logging including for example requestID.
     * 
     * @returns {Promise<Object>} Updated user object without passwordHash.
     * 
     * @throws {ForbiddenError} If the requesting user attempts to edit another user.
     * @throws {BadRequestError} If no fields were provided.
     * @throws {NotFoundError} If the user does not exist.
     * @throws {Error} For database or transactional errors.
     */
    async edit(id, user, { newUsername, newPassword }, metadata){

        logger.setMetadata(metadata);
        let conn;

        // Check if requesting user has permissions to edit
        if(id !== user.id){

            logger.info(`User by id: ${user.id} attempted to edit user by id: ${id}`, 'edit');
            throw new ForbiddenError();

        }

        // Checking if at least one parameter value was provided
        if(!newUsername && !newPassword){

            logger.info('Called edit user with no parameters to edit', 'edit');
            throw new BadRequestError('No fields were provided for editing');

        }

        let newPasswordHash;
        if(newPassword){
            newPasswordHash = await hashPassword(newPassword);
        }

        try{

            conn = await getConnection();
            await conn.beginTransaction();

            // Check if user to edit exists
            const userToEdit = await UserModel.getById(conn, id, metadata);
            if(!userToEdit){
                logger.info(`Received request to edit non existing userId: ${id}`, 'edit');
                return;
            }
            logger.debug(`User by id: ${id} found.`, 'edit');

            // Edit the user
            logger.debug(`Editing user by id: ${id}.`, 'edit');
            await UserModel.update(conn, id, {username: newUsername, passwordHash: newPasswordHash}, metadata);
            //Commit transaction
            await conn.commit();
            // retreive edited user
            logger.info(`Successfully edited user by id: ${id}`, 'edit');
            const user = await UserModel.getById(conn, id, metadata);
            delete user.passwordHash;
            return user;

        } catch(err) {

            // Rollback if anything goes wrong
            if (conn) await conn.rollback();
            if(!err.isAppError || err.status === 500) logger.error(`Failed to edit user by id: ${id}`, 'edit');
            else logger.info(`Refused to edit user by id: ${id}`, 'edit');
            throw err;

        } finally {

            if (conn) conn.release();

        }

    }
};

export default UserService;