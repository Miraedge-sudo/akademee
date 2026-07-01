/**
 * Global Error Middleware
 */

const isDev = process.env.NODE_ENV === 'development';

const errorMiddleware = (err, req, res, next) => {
  if (!err || typeof err !== 'object') {
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }

  if (isDev) {
    console.error(err);
  }

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit.',
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files.',
      });
    }
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError' ? 'Token expired.' : 'Invalid token.',
    });
  }

  const statusCode = err.status || 500;
  const message = statusCode === 500 && !isDev
    ? 'Internal server error.'
    : err.message || 'Internal server error.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;
