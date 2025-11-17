import { InternalError } from "./errors.js";

/**
 * Normalizes errors into application-safe error objects.
 *
 * This function ensures that any unexpected or non-application errors
 * (i.e., those not extending from `AppError`) are converted into a generic
 * `InternalError` instance. This prevents leaking internal implementation
 * details to API consumers while maintaining consistent error handling
 * throughout the system.
 *
 * 
 * @param {Error} err - The error object to process. May be an `AppError` or any other `Error`.
 * 
 * @returns {import('../utils/errors.js').AppError} - Returns the same error if it's an application error, or a new `InternalError` otherwise.
 * 
 * @throws {TypeError} If the provided argument is `null` or `undefined`.
 */
export function handleError(err){
    if(!err)
        throw new TypeError('handleError expectes a non null and non undefined argument');

    if(!err.isAppError){
        return new InternalError();
    } else {
        return err;
    }
}