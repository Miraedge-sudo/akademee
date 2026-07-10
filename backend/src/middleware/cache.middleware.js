const cache = require('../utils/cache');

function cacheMiddleware(ttl) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = cache.buildKey('http', req.originalUrl);
    const cached = cache.get(key);

    if (cached !== undefined) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      cache.set(key, body, ttl);
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

function invalidateCache(prefix) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode < 400) {
        const cleared = cache.delByPrefix(prefix || 'http');
        if (cleared > 0) {
          const logger = require('../utils/logger');
          logger.debug(`Cache invalidated: ${cleared} keys with prefix "${prefix || 'http'}"`);
        }
      }
    });
    next();
  };
}

function invalidateCacheSync(prefix) {
  return cache.delByPrefix(prefix || 'http');
}

module.exports = { cacheMiddleware, invalidateCache, invalidateCacheSync };
