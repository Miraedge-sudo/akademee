const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Human-readable messages for common error scenarios.
 */
const HUMAN_MESSAGES = {
  // ── Multer upload errors ──
  LIMIT_FILE_SIZE: 'The file is too large. Maximum size allowed is 5 MB.',
  LIMIT_FILE_COUNT: 'Too many files uploaded at once. Please upload them one by one.',
  LIMIT_UNEXPECTED_FILE: (field) =>
    `Unexpected file field "${field}". Please check the form and try again.`,

  // ── Database / Connection ──
  ECONNREFUSED: 'Unable to connect to the database. Please check your connection and try again.',
  ECONNRESET: 'The database connection was lost. Please try again.',
  ETIMEDOUT: 'The request timed out. Please try again.',

  // ── Unique constraint violations ──
  DUPLICATE_ENTRY: 'This record already exists. Please use a different value.',
  FOREIGN_KEY_VIOLATION: 'The related record could not be found. Please check your selection.',
  NOT_NULL_VIOLATION: 'A required value is missing. Please check your input and try again.',

  // ── Generic fallbacks by status code ──
  400: 'The request could not be processed. Please check the information provided and try again.',
  401: 'You need to be logged in to access this feature. Please log in and try again.',
  403: 'You do not have permission to perform this action. Please contact your school administrator.',
  404: 'The requested resource could not be found. It may have been moved or deleted.',
  409: 'This action could not be completed because of a conflict with existing data. Please refresh and try again.',
  422: 'The submitted data is invalid. Please review your input and try again.',
  429: 'Too many requests. Please wait a moment before trying again.',
  500: 'An unexpected error occurred. Our team has been notified. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again in a few moments.',
  503: 'The service is temporarily unavailable. Please try again later.',
};

/**
 * Attempts to detect a database unique-constraint violation from a Postgres error.
 */
function isDuplicateKeyError(err) {
  return (
    err.code === '23505' ||
    (err.constraint && err.constraint.includes('_unique')) ||
    (err.message &&
      /duplicate\s+key|unique\s+constraint|already\s+exists/i.test(err.message))
  );
}

function isForeignKeyError(err) {
  return err.code === '23503' || (err.message && /foreign\s+key\s+violation/i.test(err.message));
}

function isConnectionError(err) {
  return ['ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'].includes(err.code);
}

/**
 * Returns a human-friendly message depending on the error type and status code.
 */
function getHumanMessage(err, statusCode) {
  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code && typeof HUMAN_MESSAGES[err.code] === 'function') {
      return HUMAN_MESSAGES[err.code](err.field);
    }
    return HUMAN_MESSAGES[err.code] || `File upload failed: ${err.message}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return err.name === 'TokenExpiredError'
      ? 'Your session has expired. Please log in again.'
      : 'Invalid authentication token. Please log in again.';
  }

  // Database connection errors
  if (isConnectionError(err)) {
    return HUMAN_MESSAGES[err.code];
  }

  // Duplicate key violations
  if (isDuplicateKeyError(err)) {
    return HUMAN_MESSAGES.DUPLICATE_ENTRY;
  }

  // Foreign key violations
  if (isForeignKeyError(err)) {
    return HUMAN_MESSAGES.FOREIGN_KEY_VIOLATION;
  }

  // NOT NULL violations
  if (err.code === '23502') {
    return HUMAN_MESSAGES.NOT_NULL_VIOLATION;
  }

  // For AppError and other known status codes, prefer the original message if it's
  // substantially descriptive (> 15 chars), otherwise fall back to the generic message.
  if (err instanceof AppError) {
    if (err.message && err.message.length > 15) {
      return err.message;
    }
  }

  // Fallback by status code
  if (HUMAN_MESSAGES[statusCode]) {
    return HUMAN_MESSAGES[statusCode];
  }

  return null; // use default
}

const errorMiddleware = (err, req, res, _next) => {
  const reqId = req.reqId || '-';

  // ── AppError instances ──
  if (err instanceof AppError) {
    const humanMessage = getHumanMessage(err, err.statusCode);
    const message = humanMessage || err.message || 'An error occurred';

    logger.warn(`${err.statusCode} ${err.message}`, {
      reqId,
      path: req.originalUrl,
      method: req.method,
      details: err.details,
    });

    return res.status(err.statusCode).json({
      success: false,
      message,
      details: err.details || undefined,
      reqId,
    });
  }

  // ── Multer (file upload) errors ──
  if (err.name === 'MulterError') {
    const message = getHumanMessage(err, 400);
    logger.warn(`Multer error: ${err.code}`, { reqId, path: req.originalUrl });
    return res.status(400).json({
      success: false,
      message,
      reqId,
    });
  }

  // ── JWT errors ──
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    const message = getHumanMessage(err, 401);
    logger.warn(`JWT error: ${err.name}`, { reqId });
    return res.status(401).json({
      success: false,
      message,
      reqId,
    });
  }

  // ── Database errors (Postgres error codes) ──
  if (err.code && (String(err.code).length >= 4 || isConnectionError(err))) {
    const humanMessage = getHumanMessage(err, 400);

    // Log full detail for debugging
    logger.error(`Database error: [${err.code}] ${err.message}`, {
      reqId,
      path: req.originalUrl,
      method: req.method,
      detail: err.detail,
      constraint: err.constraint,
    });

    // Use friendly message for known codes; generic DB error for unknown codes
    const message =
      humanMessage ||
      'A database error occurred. Please try again or contact support.';

    return res.status(409).json({
      success: false,
      message,
      reqId,
    });
  }

  // ── Catch-all ──
  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message = getHumanMessage(err, statusCode) || err.message || 'An unexpected error occurred';

  logger.error(`${statusCode} - ${err.message}`, {
    reqId,
    path: req.originalUrl,
    method: req.method,
    stack: isProduction ? undefined : err.stack,
    ...(err.details || {}),
  });

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode >= 500 ? HUMAN_MESSAGES[500] : message,
    reqId,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
