/**
 * Authentication controller.
 *
 * Handles user signup and login requests and delegates business logic to
 * `AuthService`. Centralizes logging, error handling, and standardized
 * response formatting.
 *
 * Each request is associated with a `requestId` (set by requestSignature middleware)
 * for traceability across logs and services.
 */

import { successResponse, errorResponse } from "../utils/response.js";
import { handleError } from "../utils/errorHandler.js";
import AuthService from "../services/auth.service.js";
import { createLogger } from "../config/logger.js";

const logger = createLogger('auth.controller');

/**
 * Handles user registration requests.
 *
 * @async
 * @param {import('express').Request} req - Express request object containing `username` and `password`.
 * @param {import('express').Response} res - Express response object.
 * 
 * @returns {Promise<import('express').Response>} JSON response with newly created user.
 */
export async function signup (req, res) {
    const requestId = req.meta.id
    logger.setRequestId(requestId);
    const {username, password} = req.body;

    try{
        logger.debug(`Signup request received for username: ${username}`, 'signup');
        const user = await AuthService.create(requestId, {username, password});
        logger.info(`Signup successful for user: ${username}`, 'signup');
        return successResponse(req, res, 'User created successfully', user, 201);

    } catch (err) {
        logger.error(`Signup failed for username: ${username}`, 'signup', err);
        const sanitizedError = handleError(err);
        return errorResponse(req, res, sanitizedError);
    }
}

/**
 * Handles user login and JWT token issuance.
 *
 * @async
 * @param {import('express').Request} req - Express request object containing login credentials.
 * @param {import('express').Response} res - Express response object.
 * 
 * @returns {Promise<import('express').Response>} JSON response containing the authentication token.
 */
export async function login (req, res) {
    const requestId = req.meta.id
    logger.setRequestId(requestId);
    const {username, password} = req.body;

    try{
        logger.debug(`Login request received for username: ${username}`, 'login');
        const token = await AuthService.authenticate(requestId, username, password);
        logger.info(`Login successful for user: ${username}`, 'login');
        return successResponse(req, res, 'Login successful', {token: token}, 200);

    } catch (err) {
        logger.error(`Login failed for username: ${username}`, 'login', err);
        const sanitizedError = handleError(err);
        return errorResponse(req, res, sanitizedError);
    }
}