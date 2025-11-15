import { ValidationError } from "../utils/errors.js";
import { ERROR_CODES } from "../constants/errorCodes.js";
import { errorResponse } from "../utils/response.js";

export function validateBody(schema) {
    return (req, res, next) => {
        const {error} = schema.validate(req.body, {abortEarly: false});

        if(error) {
            const details = error.details.map((error) => error.message);
            const customError = new ValidationError('Invalid contents in request body.', ERROR_CODES.VALIDATION_ERROR, details);
            return errorResponse(res, customError);
        }

        next();
    };
}

export function validateParams(schema) {
    return (req, res, next) => {
        const {error} = schema.validate(req.params, {abortEarly: false});

        if(error) {
            const details = error.details.map((error) => error.message);
            const customError = new ValidationError('Invalid contents in request parameters.', ERROR_CODES.VALIDATION_ERROR, details);
            return errorResponse(res, customError);
        }

        next();
    };
}

export function validateQuery(schema) {
    return (req, res, next) => {
        const {error} = schema.validate(req.query, {abortEarly: false});

        if(error) {
            const details = error.details.map((error) => error.message);
            const customError = new ValidationError('Invalid contents in request query.', ERROR_CODES.VALIDATION_ERROR, details);
            return errorResponse(res, customError);
        }

        next();
    };
}