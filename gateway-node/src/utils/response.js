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
 * @param {string} message - Human-readable message.
 * @param {string} [code='GENERIC_ERROR'] - Application-specific error code (for frontend handling or logs).
 * @param {number} [status=400] - HTTP status code.
 * @param {any} [details=null] - Optional additional error information (e.g., validation errors).
 * 
 * @returns {import('express').Response} The Express response object (for chaining or testing).
 * 
 * @throws {TypeError} if res or message are missing or invalid.
 */
export function errorResponse(res, message, code = 'GENERIC_ERROR', status = 400, details = null) {
  if (!res || typeof res.status !== 'function') {
    throw new TypeError('errorResponse expected a valid Express response object as the first argument');
  }
  if (typeof message !== 'string' || !message.length) {
    throw new TypeError('errorResponse expected a non-empty message string');
  }

  return res.status(status).json({
    success: false,
    message,
    error: { code, details }
  });
}