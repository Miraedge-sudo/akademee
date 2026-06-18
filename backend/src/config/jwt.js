/**
 * JWT Configuration
 */

module.exports = {
  secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  algorithm: 'HS256',
};
