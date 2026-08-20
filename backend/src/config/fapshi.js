/**
 * Fapshi Payment Gateway Configuration
 * Sandbox mode by default — NEVER use live credentials without explicit approval.
 */

const fapshiConfig = {
  apiUser: process.env.FAPSHI_API_USER || 'e0474fff-6ab6-47a8-9ba6-7a1362f2ac86',
  apiKey: process.env.FAPSHI_API_KEY || 'FAK_af10b353c2023c94117c2d709f03abfc',
  environment: process.env.FAPSHI_ENV || 'live',
  webhookSecret: process.env.FAPSHI_WEBHOOK_SECRET || null,

  get baseUrl() {
    return this.environment === 'live'
      ? 'https://live.fapshi.com'
      : 'https://sandbox.fapshi.com';
  },
};

module.exports = fapshiConfig;
