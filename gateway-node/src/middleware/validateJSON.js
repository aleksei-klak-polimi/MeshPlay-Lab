import express from 'express';
import { createLogger } from '../config/logger.js';
import { BadRequestError } from '../utils/errors.js';
import { errorResponse } from '../utils/response.js';

const logger = createLogger('middleware.validateJSON');

export const verifyJson = (req, res, buf) => {
  try {
    JSON.parse(buf.toString());
  } catch (err) {
    err.isBodyParser = true;
    throw err;
  }
};

/**
 * Express middleware that parses JSON request bodies and validates syntax.
 * Throws a custom error if invalid JSON is detected before route handlers execute.
 *
 * @type {import('express').RequestHandler}
 */
export const jsonParserWithValidation = express.json({ verify: verifyJson });

/**
 * Express error-handling middleware for malformed JSON bodies.
 * Converts syntax errors from `express.json()` into standardized API error responses.
 *
 * @param {Error} err - The thrown error, potentially a SyntaxError from body parsing.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * 
 * @returns {import('express').Response|void}
 */
export const invalidJsonErrorHandler = (err, req, res, next) => {
  if (err.isBodyParser || err instanceof SyntaxError) {
    logger.warn(`Malformed JSON received: ${err.message}`);
    const error = new BadRequestError('Invalid JSON format in request body', 'BAD_REQUEST');
    return errorResponse(res, error);
  }
  next(err);
};