import express from 'express';
import logger from '../config/logger.js';

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
    return res.status(400).json({
      success: false,
      message: "Invalid JSON format in request body",
      error: { code: "BAD_REQUEST" }
    });
  }
  next(err);
};