/**
 * Cache Utility — Redis-backed with an in-memory fallback.
 *
 * Redis is the primary store so the cache is shared across instances and
 * survives restarts. When Redis is unavailable (e.g. local dev) we fall back
 * to an in-process NodeCache so requests keep working.
 *
 * Keys are namespaced:  akm:<prefix>:<scope?>:<...parts>
 * The `scope` (usually a school id) guarantees one tenant can never read
 * another tenant's cached responses.
 */

const NodeCache = require('node-cache');
const logger = require('./logger');
const { getRedisConnection } = require('../config/redis');

const DEFAULT_TTL = 300;
const CACHE_PREFIX = 'akm:';
// Cap per-command latency so a slow/absent Redis can never block a request.
const COMMAND_TIMEOUT_MS = 200;

// ── In-memory fallback ─────────────────────────────────────────────
const memoryCache = new NodeCache({
  stdTTL: DEFAULT_TTL,
  checkperiod: 120,
  useClones: false,
  maxKeys: 5000,
});

function getRedis() {
  try {
    return getRedisConnection();
  } catch (err) {
    logger.warn(`Redis unavailable for cache: ${err.message}`);
    return null;
  }
}

function isRedisReady() {
  const redis = getRedis();
  return redis && redis.status === 'ready';
}

/** Reject a Redis command if it takes longer than `ms`. */
function withTimeout(promise, ms = COMMAND_TIMEOUT_MS) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Redis command timed out')), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

function buildKey(prefix, ...parts) {
  return `${CACHE_PREFIX}${prefix}:${parts.filter(Boolean).join(':')}`;
}

async function get(key) {
  if (isRedisReady()) {
    try {
      const raw = await withTimeout(getRedis().get(key));
      if (raw !== null && raw !== undefined) return JSON.parse(raw);
    } catch (err) {
      logger.debug(`Cache GET redis miss/error, using memory: ${err.message}`);
    }
  }
  return memoryCache.get(key);
}

async function set(key, value, ttl) {
  const t = ttl ?? DEFAULT_TTL;
  memoryCache.set(key, value, t);
  if (isRedisReady()) {
    try {
      await withTimeout(getRedis().set(key, JSON.stringify(value), 'EX', t));
    } catch (err) {
      logger.debug(`Cache SET redis failed: ${err.message}`);
    }
  }
  return true;
}

async function del(key) {
  memoryCache.del(key);
  if (isRedisReady()) {
    try {
      await withTimeout(getRedis().del(key));
    } catch (err) {
      logger.debug(`Cache DEL redis failed: ${err.message}`);
    }
  }
  return true;
}

/**
 * Delete every key under `<prefix>:<scope>:` (or all `<prefix>:` keys when
 * scope is omitted). Returns the number of entries cleared.
 */
async function delByPrefix(prefix, scope) {
  const pattern = scope
    ? `${CACHE_PREFIX}${prefix}:${scope}:`
    : `${CACHE_PREFIX}${prefix}:`;

  let cleared = 0;

  // Memory cleanup
  const memKeys = memoryCache.keys().filter((k) => k.startsWith(pattern));
  if (memKeys.length > 0) {
    memoryCache.del(memKeys);
    cleared += memKeys.length;
  }

  // Redis SCAN + DEL (never FLUSHDB — BullMQ queues share this Redis)
  if (isRedisReady()) {
    try {
      const redis = getRedis();
      let cursor = '0';
      do {
        const [nextCursor, keys] = await withTimeout(
          redis.scan(cursor, 'MATCH', `${pattern}*`, 'COUNT', 100),
          500
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          cleared += keys.length;
          await withTimeout(redis.del(...keys), 500);
        }
      } while (cursor !== '0');
    } catch (err) {
      logger.debug(`Cache invalidation redis failed: ${err.message}`);
    }
  }

  return cleared;
}

/** Clear only Akademee's own keyspace — never the whole shared Redis DB. */
async function flush() {
  memoryCache.flushAll();

  if (!isRedisReady()) return 0;

  let cleared = 0;
  try {
    const redis = getRedis();
    let cursor = '0';
    do {
      const [nextCursor, keys] = await withTimeout(
        redis.scan(cursor, 'MATCH', `${CACHE_PREFIX}*`, 'COUNT', 100),
        500
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        cleared += keys.length;
        await withTimeout(redis.del(...keys), 500);
      }
    } while (cursor !== '0');
  } catch (err) {
    logger.debug(`Cache flush redis failed: ${err.message}`);
  }

  return cleared;
}

function getStats() {
  const memoryStats = memoryCache.getStats();
  return {
    ...memoryStats,
    memoryKeys: memoryCache.keys().length,
    backend: isRedisReady() ? 'redis' : 'memory',
  };
}

module.exports = {
  get,
  set,
  del,
  delByPrefix,
  flush,
  getStats,
  buildKey,
};
