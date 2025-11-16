import { successResponse, errorResponse } from "../utils/response.js";
import { handleError } from "../utils/errorHandler.js";
import UserService from "../services/user.service.js";
import { createLogger } from "../config/logger.js";

const logger = createLogger('user.controller');

export async function getUser(req, res) {
    const id = req.params.id;

    try{

        logger.debug(`Get request received for userid: ${id}`, 'getUser');
        const user = await UserService.get(id);
        logger.info(`Get request successful for resource: user by id: ${id}`, 'getUser');
        return successResponse(res, 'User fetched successfully', user, 200);

    } catch (err) {

        logger.error(`Get User failed for user id: ${id}`, 'getUser', err);
        const sanitizedError = handleError(err);
        return errorResponse(res, sanitizedError);
        
    }
}

export async function deleteUser(req, res) {
    const id = req.params.id;
    const user = req.user;

    try{

        logger.debug(`Delete request received for userid: ${id}`, 'deleteUser');
        await UserService.delete(id, user);
        logger.info(`Delete request successful for resource: user by id: ${id}`, 'deleteUser');
        return successResponse(res, 'User deleted successfully', null, 204);

    } catch (err) {

        logger.error(`Delete user failed for user id: ${id}`, 'deleteUser', err);
        const sanitizedError = handleError(err);
        return errorResponse(res, sanitizedError);
        
    }
}