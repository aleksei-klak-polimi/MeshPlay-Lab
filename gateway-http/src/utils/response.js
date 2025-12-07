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
export function successResponse(req, res, message, data = null, status = 200) {
  if (!req) {
    throw new TypeError('successResponse expected a valid Express request object.');
  }
  if (!res) {
    throw new TypeError('successResponse expected a valid Express response object.');
  }
  if (typeof message !== 'string' || !message.length) {
    throw new TypeError('successResponse expected a non-empty message string.');
  }

  const requestId = req.meta.id;
  const timeStamp = req.meta.timeStamp;

  return res.status(status).json({
    success: true,
    message,
    data,
    meta: {requestId, timeStamp}
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
 * @param {AppError} error - error object containing the information that will be sent in the response.
 * 
 * @returns {import('express').Response} The Express response object (for chaining or testing).
 * 
 * @throws {TypeError} if res or message are missing or invalid.
 */
export function errorResponse(req, res, error) {
  if (!req) {
    throw new TypeError('successResponse expected a valid Express request object.');
  }
  if (!res) {
    throw new TypeError('errorResponse expected a valid Express response object.');
  }
  if(!error) {
    throw new TypeError('errorResponse expects a non null and non undefined error object.');
  }
  if(!error.isAppError){
    throw new TypeError('errorResponse expects an appError object.');
  }

  const { message, code, status, details } = error;
  const requestId = req.meta.id;
  const timeStamp = req.meta.timeStamp;

  return res.status(status).json({
    success: false,
    message,
    error: { code, details },
    meta: {requestId, timeStamp}
  });
}