export class AppError extends Error {
  constructor(message, status = 400, code = 'GENERIC_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    this.isAppError = true;
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', code = 'CONFLICT_ERROR') {
    super(message, 409, code);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details = null) {
    super(message, 422, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Missing valid credentials', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}
