const cache = require('../utils/cache');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

/**
 * Resolve the tenant scope for the cache key so that one school can never
 * read another school's cached responses. Falls back to 'global' when no
 * tenant context is available (public endpoints).
 *
 * The JWT fallback matters because the HTTP cache middleware runs before the
 * route-level auth middleware. The token is VERIFIED (not merely decoded) so
 * a forged payload can never be used to reach another school's cached data.
 */
function resolveScope(req) {
  const tenant =
    req.schoolId ||
    req.tenantId ||
    req.user?.schoolId ||
    req.user?.tenantId ||
    req.school?.school_id;

  if (tenant) return `school:${tenant}`;
  if (req.subdomain) return `sub:${req.subdomain}`;

  try {
    const header = req.headers?.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.access_token;
    if (token) {
      const decoded = jwt.verify(token, jwtConfig.secret);
      if (decoded?.schoolId) return `school:${decoded.schoolId}`;
      if (decoded?.subdomain) return `sub:${decoded.subdomain}`;
    }
  } catch {
    // Invalid/expired token — fall through to 'global' so no school-scoped
    // cached entry can ever be served to this request.
  }

  return 'global';
}

function cacheMiddleware(ttl) {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const scope = resolveScope(req);
    const key = cache.buildKey('http', scope, req.originalUrl);

    try {
      const cached = await cache.get(key);
      if (cached !== undefined) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch (err) {
      logger.warn(`Cache read failed for ${key}: ${err.message}`);
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      res.setHeader('X-Cache', 'MISS');
      // Only cache successful responses — never poison the cache with errors.
      if (res.statusCode < 400) {
        cache.set(key, body, ttl).catch((err) => {
          logger.debug(`Cache write failed for ${key}: ${err.message}`);
        });
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate cache entries after a write completes. `prefix` defaults to the
 * HTTP cache namespace. Scoped per school (when known) so a write in one
 * school never flushes another school's cache.
 */
function invalidateCache(prefix) {
  return (req, res, next) => {
    // Only invalidate on writes — a GET must never flush the cache.
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }
    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      const scope = resolveScope(req);
      // Always invalidate within the resolved scope — including the literal
      // 'global' scope — so a write without tenant context can never wipe
      // every school's cache.
      cache
        .delByPrefix(prefix || 'http', scope)
        .catch((err) => {
          logger.debug(`Cache invalidation failed: ${err.message}`);
        });
    });
    next();
  };
}

/**
 * Fire-and-forget scoped invalidation for non-HTTP contexts (e.g. background
 * workers). Never passes an undefined scope — without a scope it targets the
 * literal 'global' namespace instead of wiping every school's cache.
 */
function invalidateCacheSync(prefix, scope) {
  return cache.delByPrefix(prefix || 'http', scope || 'global');
}

module.exports = { cacheMiddleware, invalidateCache, invalidateCacheSync };
