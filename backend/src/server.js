/**
 * Server Entry Point
 */

require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const { validateEnv } = require('./config/env');
const { startScheduler, refreshStatuses } = require('./services/scheduler.service');
const { startWorker, stopWorker } = require('./services/reportCardQueue');
const { closeRedisConnection } = require('./config/redis');
const { closeBrowser } = require('./services/reportCardPdf.service');

const { port } = validateEnv();

// ── Start the auto-status scheduler ──
startScheduler();

// ── Catch up on any status changes missed during downtime ──
refreshStatuses();

// ── Start the background job worker for report card generation ──
startWorker();

const server = app.listen(port, () => {
  logger.info(`Server started on http://localhost:${port}`);
});

async function shutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);

  // Stop background worker first (wait for active jobs to finish)
  await stopWorker();

  server.close(async () => {
    logger.info('HTTP server closed');
    const sql = require('./config/database');
    await sql.end({ timeout: 5 }).catch(() => {});
    logger.info('Database pool closed');
    await closeRedisConnection();
    logger.info('Redis connection closed');
    await closeBrowser();
    logger.info('Headless browser closed');
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
});
