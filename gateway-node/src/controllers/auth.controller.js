import { successResponse } from "../utils/response.js";
import { handleError } from "../utils/errorHandler.js";
import UserService from "../services/user.service.js";
import { createLogger } from "../config/logger.js";

const logger = createLogger('auth.controller');

export async function signup (req, res) {
    const {username, password} = req.body;

    try{
        logger.debug(`Signup request received for username: ${username}`, 'signup');
        const user = await UserService.create({username, password});
        logger.info(`Signup successful for user: ${username}`, 'signup');
        return successResponse(res, 'User created successfully', user, 201);

    } catch (err) {
        logger.error(`Signup failed for username: ${username}`, 'signup', err);
        return handleError(err, res);
    }
}

export async function login (req, res) {
    const {username, password} = req.body;

    try{
        logger.debug(`Login request received for username: ${username}`, 'login');
        const token = await UserService.authenticate(username, password);
        logger.info(`Login successful for user: ${username}`, 'login');
        return successResponse(res, 'Login successfull', {token: token}, 200);

    } catch (err) {
        logger.error(`Login failed for username: ${username}`, 'login', err);
        return handleError(err, res);
    }
}