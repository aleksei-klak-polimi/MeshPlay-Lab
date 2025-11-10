import express from 'express';
import logger from '../config/logger.js';
import { BadRequestError } from '../utils/errors.js';
import { handleError } from '../utils/errorHandler.js';

// Custom JSON parsing middleware
export const jsonParserWithValidation = express.json({
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (err) {
      err.isBodyParser = true;
      throw err;
    }
  }
});

// Error handler for invalid JSON
export const invalidJsonErrorHandler = (err, req, res, next) => {
  if (err.isBodyParser || err instanceof SyntaxError) {
    logger.warn(`Malformed JSON received: ${err.message}`);
    const err = new BadRequestError('Invalid JSON format in request body', 'BAD_REQUEST');
    return handleError(err, res);
  }
  next(err);
};