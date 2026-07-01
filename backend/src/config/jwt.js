/**
 * JWT Configuration
 * CRASHES on startup if JWT_SECRET is missing or still the default value.
 */

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret === 'your_jwt_secret_here') {
  console.error('FATAL: JWT_SECRET must be set in .env and must not be the default value.');
  process.exit(1);
}

module.exports = {
  secret: jwtSecret,
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};
