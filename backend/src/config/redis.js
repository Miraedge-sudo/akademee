/**
 * Redis Configuration — used by BullMQ for background job queues.
 *
 * Falls back to a local Redis running on the default port
 * when REDIS_URL is not set, so it works out of the box in dev.
 *
 * Environment variables:
 *   REDIS_URL       — full Redis connection string (e.g. redis://:password@host:6379)
 *   REDIS_HOST      — Redis host (default: localhost)
 *   REDIS_PORT      — Redis port (default: 6379)
 *   REDIS_PASSWORD  — Redis password (optional)
 *   REDIS_TLS       — set to 'true' to enable TLS (e.g. for Upstash, Redis Cloud)
 */

const IORedis = require('ioredis');

function createRedisConnection() {
  const url = process.env.REDIS_URL;

  if (url) {
    return new IORedis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    });
  }

  return new IORedis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
    retryStrategy(times) {
      // Exponential backoff: 1s, 2s, 4s, 8s … max 30s
      const delay = Math.min(1000 * Math.pow(2, times), 30000);
      return delay;
    },
  });
}

let connection;

function getRedisConnection() {
  if (!connection) {
    connection = createRedisConnection();
  }
  return connection;
}

async function closeRedisConnection() {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}

module.exports = { getRedisConnection, closeRedisConnection };