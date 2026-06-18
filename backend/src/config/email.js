/**
 * SMTP email configuration — used for school verification emails after registration.
 */

const emailConfig = {
  host: process.env.SMTP_HOST || process.env.EMAIL_SERVICE || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD,
  },
  from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@akademee.app',
  /** Hours until verification link expires */
  verificationExpiresHours: parseInt(process.env.VERIFICATION_EXPIRES_HOURS || '48', 10),
};

emailConfig.isConfigured = Boolean(emailConfig.auth.user && emailConfig.auth.pass);

module.exports = emailConfig;
