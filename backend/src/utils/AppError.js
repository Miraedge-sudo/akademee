class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }

  static badRequest(message = 'Bad request', details = null) {
    return new AppError(message, 400, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403);
  }

  static conflict(message = 'Resource already exists') {
    return new AppError(message, 409);
  }

  static validation(details) {
    return new AppError('Validation failed', 400, details);
  }
}

module.exports = AppError;
