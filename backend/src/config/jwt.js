/**
 * JWT Configuration
 * CRASHES on startup if JWT_SECRET is missing or still the default value.
 */

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret === 'your_jwt_secret_here') {
  console.error('FATAL: JWT_SECRET must be set in .env and must not be the default value.');
  process.exit(1);
}

function parseExpiresInToMs(value) {
  if (!value) return null;

  if (typeof value === 'number') return value;

  const match = String(value).trim().match(/^(\d+)(ms|s|m|h|d|w)?$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = (match[2] || 'ms').toLowerCase();
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return amount * (multipliers[unit] || 1);
}

const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

module.exports = {
  secret: jwtSecret,
  expiresIn,
  refreshExpiresIn,
  accessCookieMaxAgeMs: parseExpiresInToMs(expiresIn) || 7 * 24 * 60 * 60 * 1000,
  refreshCookieMaxAgeMs: parseExpiresInToMs(refreshExpiresIn) || 30 * 24 * 60 * 60 * 1000,
};
