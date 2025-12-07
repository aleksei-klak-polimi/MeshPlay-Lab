import { ValidationError } from "../utils/errors.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { errorResponse } from "../utils/response.js";

/**
 * Middleware factory for validating request bodies against a Joi schema.
 *
 * If validation fails:
 *  - A `ValidationError` is thrown
 *  - All validation issue messages are included as details
 *  - A standardized error response is returned
 *
 * @param {import('joi').Schema} schema - Joi schema for validating req.body.
 * 
 * @returns {import('express').RequestHandler} Express middleware.
 */
export function validateBody(schema) {
    return (req, res, next) => {
        const {error} = schema.validate(req.body, {abortEarly: false});

        if(error) {
            const details = error.details.map((error) => error.message);
            const customError = new ValidationError('Invalid contents in request body.', ERROR_CODES.VALIDATION_ERROR, details);
            return errorResponse(req, res, customError);
        }

        next();
    };
}

/**
 * Middleware factory for validating request paramteres against a Joi schema.
 *
 * If validation fails:
 *  - A `ValidationError` is thrown
 *  - All validation issue messages are included as details
 *  - A standardized error response is returned
 *
 * @param {import('joi').Schema} schema - Joi schema for validating req.params.
 * 
 * @returns {import('express').RequestHandler} Express middleware.
 */
export function validateParams(schema) {
    return (req, res, next) => {
        const {error} = schema.validate(req.params, {abortEarly: false});

        if(error) {
            const details = error.details.map((error) => error.message);
            const customError = new ValidationError('Invalid contents in request parameters.', ERROR_CODES.VALIDATION_ERROR, details);
            return errorResponse(req, res, customError);
        }

        next();
    };
}

/**
 * Middleware factory for validating request queries against a Joi schema.
 *
 * If validation fails:
 *  - A `ValidationError` is thrown
 *  - All validation issue messages are included as details
 *  - A standardized error response is returned
 *
 * @param {import('joi').Schema} schema - Joi schema for validating req.query.
 * 
 * @returns {import('express').RequestHandler} Express middleware.
 */
export function validateQuery(schema) {
    return (req, res, next) => {
        const {error} = schema.validate(req.query, {abortEarly: false});

        if(error) {
            const details = error.details.map((error) => error.message);
            const customError = new ValidationError('Invalid contents in request query.', ERROR_CODES.VALIDATION_ERROR, details);
            return errorResponse(req, res, customError);
        }

        next();
    };
}