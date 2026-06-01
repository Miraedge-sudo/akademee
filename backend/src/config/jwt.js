module.exports = {
  secret: process.env.JWT_SECRET || 'replace_this_in_env',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};
