const NodeCache = require('node-cache');

const DEFAULT_TTL = 300;
const CACHE_PREFIX = 'akm:';

const cache = new NodeCache({
  stdTTL: DEFAULT_TTL,
  checkperiod: 120,
  useClones: false,
  maxKeys: 5000,
});

function buildKey(prefix, ...parts) {
  return `${CACHE_PREFIX}${prefix}:${parts.filter(Boolean).join(':')}`;
}

function get(key) {
  return cache.get(key);
}

function set(key, value, ttl) {
  return cache.set(key, value, ttl ?? DEFAULT_TTL);
}

function del(key) {
  return cache.del(key);
}

function delByPrefix(prefix) {
  const pattern = `${CACHE_PREFIX}${prefix}:`;
  const keys = cache.keys().filter((k) => k.startsWith(pattern));
  if (keys.length > 0) cache.del(keys);
  return keys.length;
}

function flush() {
  cache.flushAll();
}

function getStats() {
  return cache.getStats();
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
