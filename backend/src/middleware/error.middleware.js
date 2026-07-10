const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, _next) => {
  const reqId = req.reqId || '-';

  if (err instanceof AppError) {
    logger.warn(`${err.statusCode} ${err.message}`, {
      reqId,
      path: req.originalUrl,
      method: req.method,
      details: err.details,
    });
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details || undefined,
      reqId,
    });
  }

  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'File too large',
      LIMIT_FILE_COUNT: 'Too many files',
      LIMIT_UNEXPECTED_FILE: `Unexpected file field: ${err.field}`,
    };
    logger.warn(`Multer error: ${err.code}`, { reqId, path: req.originalUrl });
    return res.status(400).json({
      success: false,
      message: messages[err.code] || err.message,
      reqId,
    });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    logger.warn(`JWT error: ${err.name}`, { reqId });
    return res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid token',
      reqId,
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  logger.error(`${statusCode} - ${err.message}`, {
    reqId,
    path: req.originalUrl,
    method: req.method,
    stack: isProduction ? undefined : err.stack,
    ...(err.details || {}),
  });

  res.status(statusCode).json({
    success: false,
    message: isProduction && statusCode >= 500 ? 'Internal server error' : err.message,
    reqId,
    ...(isProduction ? {} : { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
