/**
 * Fapshi Payment Gateway Configuration
 * Sandbox mode by default — NEVER use live credentials without explicit approval.
 */

const fapshiConfig = {
  apiUser: process.env.FAPSHI_API_USER || '38242789-cf89-4674-8787-9a9fdaaf645c',
  apiKey: process.env.FAPSHI_API_KEY || 'FAK_TEST_78cc120bb0e8ea84da62',
  environment: process.env.FAPSHI_ENV || 'sandbox',
  webhookSecret: process.env.FAPSHI_WEBHOOK_SECRET || null,

  get baseUrl() {
    return this.environment === 'live'
      ? 'https://live.fapshi.com'
      : 'https://sandbox.fapshi.com';
  },
};

module.exports = fapshiConfig;
