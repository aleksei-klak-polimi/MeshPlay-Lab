import { successResponse, errorResponse } from "../utils/response.js";
import { handleError } from "../utils/errorHandler.js";
import UserService from "../services/user.service.js";
import { createLogger } from "../config/logger.js";

const logger = createLogger('user.controller');

export async function getUser(req, res) {
    const requestId = req.meta.id
    logger.setRequestId(requestId);
    const id = req.params.id;

    try{

        logger.debug(`Get request received for userid: ${id}`, 'getUser');
        const user = await UserService.get(requestId, id);
        logger.info(`Get request successful for resource: user by id: ${id}`, 'getUser');
        return successResponse(req, res, 'User fetched successfully', user, 200);

    } catch (err) {

        logger.error(`Get User failed for user id: ${id}`, 'getUser', err);
        const sanitizedError = handleError(err);
        return errorResponse(req, res, sanitizedError);
        
    }
}

export async function deleteUser(req, res) {
    const requestId = req.meta.id
    logger.setRequestId(requestId);
    const id = req.params.id;
    const user = req.user;

    try{

        logger.debug(`Delete request received for userid: ${id}`, 'deleteUser');
        await UserService.delete(requestId, id, user);
        logger.info(`Delete request successful for resource: user by id: ${id}`, 'deleteUser');
        return successResponse(req, res, 'User deleted successfully', null, 204);

    } catch (err) {

        logger.error(`Delete user failed for user id: ${id}`, 'deleteUser', err);
        const sanitizedError = handleError(err);
        return errorResponse(req, res, sanitizedError);
        
    }
}

export async function editUser(req, res) {
    const requestId = req.meta.id
    logger.setRequestId(requestId);
    const id = req.params.id;
    const user = req.user;
    const { username, password } = req.body;

    try{

        logger.debug(`Edit request received for userid: ${id}`, 'editUser');
        const updatedUser = await UserService.edit(requestId, id, user, { newUsername: username, newPassword: password });
        logger.info(`Edit request successful for resource: user by id: ${id}`, 'editUser');
        return successResponse(req, res, 'User edited successfully', updatedUser, 200);

    } catch (err) {

        logger.error(`Edit user failed for user id: ${id}`, 'editUser', err);
        const sanitizedError = handleError(err);
        return errorResponse(req, res, sanitizedError);
        
    }
}