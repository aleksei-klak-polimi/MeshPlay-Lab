import { InternalError } from "../constants/errors.js";

/**
 * Normalizes thrown errors into application-safe error objects.
 *
 * If the provided error is not an "AppError" (i.e., does not include
 * the `isAppError` flag used across this system), the sanitizer wraps it
 * into an {@link InternalError} instance, ensuring that no raw internal
 * exceptions propagate to clients.
 *
 * This function is used when routing client messages or handling unexpected
 * failures in the WebSocket server.
 *
 * @param {Error} error - Any caught error instance.
 * @param {string} message - Generic fallback message for unexpected errors.
 *
 * @returns {import('../constants/errors.js').AppError} - A safe, standardized error object.
 */
export function sanitizeError(error, message){

    if(!error.isAppError){
        return new InternalError(message);
    }
    else
        return error;
}