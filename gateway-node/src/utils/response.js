import { AppError } from './errors.js';

/**
 * Sends a standardized JSON success response.
 * 
 * This function centralizes the API error format, ensuring all controllers
 * return consistent error structures to clients. Intended for internal use
 * (controllers, error handlers) — not for direct user input validation.
 * 
 * @param {import('express').Response} res - Express response object.
 * @param {string} message - Human-readable message.
 * @param {any} [data=null] - Optional payload.
 * @param {number} [status=200] - HTTP status code.
 * 
 * @returns {import('express').Response} The Express response object (for chaining or testing).
 * 
 * @throws {TypeError} if res or message are missing or invalid.
 */
export function successResponse(res, message, data = null, status = 200) {
  if (!res || typeof res.status !== 'function') {
    throw new TypeError('successResponse expected a valid Express response object as the first argument');
  }
  if (typeof message !== 'string' || !message.length) {
    throw new TypeError('successResponse expected a non-empty message string');
  }

  return res.status(status).json({
    success: true,
    message,
    data
  });
}

/**
 * Sends a standardized JSON error response.
 * 
 * This function centralizes the API error format, ensuring all controllers
 * return consistent error structures to clients. Intended for internal use
 * (controllers, error handlers) — not for direct user input validation.
 * 
 * @param {import('express').Response} res - Express response object.
 * @param {AppError} error - error object containing the core information that will be sent in the response.
 * @param {any} [details=null] - Optional additional error information (e.g., validation errors).
 * 
 * @returns {import('express').Response} The Express response object (for chaining or testing).
 * 
 * @throws {TypeError} if res or message are missing or invalid.
 */
export function errorResponse(res, error, details = null) {
  if (!res || typeof res.status !== 'function') {
    throw new TypeError('errorResponse expected a valid Express response object as the first argument.');
  }
  if(!error) {
    throw new TypeError('errorResponse expects a non null and non undefined error as the second argument.');
  }
  if(!error.isAppError){
    throw new TypeError('errorResponse expects an appError as the second argument.');
  }

  const { message, code, status } = error;

  return res.status(status).json({
    success: false,
    message,
    error: { code, details }
  });
}