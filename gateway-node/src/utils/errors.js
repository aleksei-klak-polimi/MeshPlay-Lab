import { ERROR_CODES } from '../constants/errorCodes.js';

export class AppError extends Error {
  constructor(message, status = 400, code = ERROR_CODES.GENERIC_ERROR) {
    super(message);
    this.status = status;
    this.code = code;
    this.isAppError = true;
  }
}

export class InternalError extends AppError {
  constructor(message = 'An unexpected server error occurred', code = ERROR_CODES.INTERNAL_ERROR) {
    super(message, 500, code);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', code = ERROR_CODES.CONFLICT_ERROR) {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', code = ERROR_CODES.VALIDATION_ERROR) {
    super(message, 422, code);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = ERROR_CODES.NOT_FOUND) {
    super(message, 404, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Missing valid credentials', code = ERROR_CODES.UNAUTHORIZED) {
    super(message, 401, code);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code = ERROR_CODES.BAD_REQUEST) {
    super(message, 400, code);
  }
}