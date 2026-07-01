/**
 * SMTP email configuration — used for school verification emails after registration.
 */

function getIsConfigured() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
  return Boolean(user && pass);
}

const emailConfig = {
  get host() { return process.env.SMTP_HOST || process.env.EMAIL_SERVICE || 'smtp.gmail.com'; },
  get port() { return parseInt(process.env.SMTP_PORT || '587', 10); },
  get secure() { return process.env.SMTP_SECURE === 'true'; },
  get auth() {
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD;
    if (!user || !pass) return null;
    return { user, pass };
  },
  get from() { return process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@akademee.app'; },
  get verificationExpiresHours() { return parseInt(process.env.VERIFICATION_EXPIRES_HOURS || '48', 10); },
  get resetExpiresHours() { return parseInt(process.env.RESET_EXPIRES_HOURS || '1', 10); },
  get isConfigured() { return getIsConfigured(); },
};

module.exports = emailConfig;
