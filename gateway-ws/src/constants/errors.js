import codes from "../protocol/status/codes.js";

/**
 * Base class for all application-specific errors.
 */
export class AppError{
    /**
     * @param {codes} code - A numeric code indicating the specific error.
     * @param {string|null} [message=null] - A descriptive error message.
     */
    constructor(code = codes.GENERIC_ERROR, message = null){
        /**@type {codes} */
        this.code = code;

        /** @type {string|null} */
        this.message = message;

         /** @type {boolean} */
        this.isAppError = true;

        /** @type {string} */
        this.name = 'AppError';
    }
}

/**
 * Error indicating that a client message has an invalid format.
 */
export class InvalidMessageFormat extends AppError{
    /**
     * @param {string} [message='Request is formatted incorrectly.'] - Optional custom error message.
     */
    constructor(message = 'Request is formatted incorrectly.'){
        super(codes.INVALID_INPUT, message);
        this.name = 'InvalidRequestFormat';
    }
}

/**
 * Error indicating that a requested target does not exist or cannot be found.
 */
export class InvalidTarget extends AppError{
    /**
     * @param {string} [message='Target not found.'] - Optional custom error message.
     */
    constructor(message = 'Target not found.'){
        super(codes.INVALID_TARGET, message);
        this.name = 'InvalidTarget';
    }
}

/**
 * Error representing an unexpected internal server failure.
 */
export class InternalError extends AppError{
    /**
     * @param {string} [message='Could not fulfill request due to an unexpected server error.'] - Optional custom error message.
     */
    constructor(message = 'Could not fulfill request due to an unexpected server error.'){
        super(codes.INTERNAL_ERROR, message);
        this.name = 'InternalError';
    }
}