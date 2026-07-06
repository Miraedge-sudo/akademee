const logger = require('../utils/logger');

const requiredVars = [
  'DATABASE_URL',
  'JWT_SECRET',
];

const optionalVars = [
  'PORT',
  'NODE_ENV',
  'LOG_LEVEL',
  'JWT_EXPIRES_IN',
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'DATABASE_SSL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASSWORD',
  'EMAIL_FROM',
  'FRONTEND_URL',
  'FRONTEND_URL_PRODUCTION',
  'TENANT_DEV_DOMAIN',
  'TENANT_PROD_DOMAIN',
  'SENTRY_DSN',
  'SENTRY_TRACES_SAMPLE_RATE',
];

function validateEnv() {
  const missing = requiredVars.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      logger.warn('Running in development mode without all required env vars — some features may not work');
    }
  }

  const port = process.env.PORT || 5000;
  const nodeEnv = process.env.NODE_ENV || 'development';

  logger.info(`Environment: ${nodeEnv}, Port: ${port}`);

  return { port, nodeEnv };
}

module.exports = { validateEnv, requiredVars, optionalVars };
