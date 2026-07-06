/**
 * Server Entry Point
 */

require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const { validateEnv } = require('./config/env');

const { port } = validateEnv();

const server = app.listen(port, () => {
  logger.info(`Server started on http://localhost:${port}`);
});

function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    const sql = require('./config/database');
    sql.end({ timeout: 5 }).catch(() => {});
    logger.info('Database pool closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { stack: error.stack, message: error.message });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason: reason?.stack || reason });
  process.exit(1);
});
