import { ERROR_CODES } from '../constants/errorCodes.js';

export class AppError extends Error {
  /**
   * @param {string} message - Human-readable message.
   * @param {number} status - HTTP status code.
   * @param {string} code - Machine-readable error code.
   * @param {any|any[]} [details=[]] - Additional contextual info.
   */
  constructor(message, status = 400, code = ERROR_CODES.GENERIC_ERROR, details = []) {
    super(message);

    this.status = status;
    this.code = code;
    this.isAppError = true;

    // Normalize details
    if (details == null) {
      this.details = [];
    } else if (Array.isArray(details)) {
      this.details = details;
    } else {
      this.details = [details];
    }
  }
}

export class InternalError extends AppError {
  constructor(
    message = 'An unexpected server error occurred',
    code = ERROR_CODES.INTERNAL_ERROR,
    details
  ) {
    super(message, 500, code, details);
  }
}

export class ConflictError extends AppError {
  constructor(
    message = 'Resource conflict',
    code = ERROR_CODES.CONFLICT_ERROR,
    details
  ) {
    super(message, 409, code, details);
  }
}

export class ValidationError extends AppError {
  constructor(
    message = 'Validation failed',
    code = ERROR_CODES.VALIDATION_ERROR,
    details
  ) {
    super(message, 422, code, details);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message = 'Resource not found',
    code = ERROR_CODES.NOT_FOUND,
    details
  ) {
    super(message, 404, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = 'Missing valid credentials',
    code = ERROR_CODES.UNAUTHORIZED,
    details
  ) {
    super(message, 401, code, details);
  }
}

export class BadRequestError extends AppError {
  constructor(
    message = 'Bad request',
    code = ERROR_CODES.BAD_REQUEST,
    details
  ) {
    super(message, 400, code, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message = 'You do not have permission to perform this action.',
    code = ERROR_CODES.FORBIDDEN,
    details
  ) {
    super(message, 403, code, details);
  }
}
