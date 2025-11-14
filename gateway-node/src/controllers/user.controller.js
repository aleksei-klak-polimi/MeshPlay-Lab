import { successResponse, errorResponse } from "../utils/response.js";
import { handleError } from "../utils/errorHandler.js";
import UserService from "../services/user.service.js";
import { createLogger } from "../config/logger.js";

const logger = createLogger('user.controller');

export async function getUser(req, res) {
    const id = req.params.id;

    try{

        logger.debug(`Get request received for userid: ${id}`, 'get');
        const user = await UserService.get(id);
        logger.info(`Get request successful for resource: user by id: ${id}`, 'get');
        return successResponse(res, 'User fetched successfully', user, 200);

    } catch (err) {

        logger.error(`Signup failed for username: ${username}`, 'signup', err);
        const sanitizedError = handleError(err);
        return errorResponse(res, sanitizedError);
        
    }
}