/**
 * Fapshi Payment Gateway Configuration
 * Sandbox mode by default — NEVER use live credentials without explicit approval.
 */

const fapshiConfig = {
  apiUser: process.env.FAPSHI_API_USER || 'e5382fe2-71f3-469b-8ae2-c7660592fe85',
  apiKey: process.env.FAPSHI_API_KEY || 'FAK_de06f456f02f656eb58ef19cec7dffd1',
  environment: process.env.FAPSHI_ENV || 'sandbox',
  webhookSecret: process.env.FAPSHI_WEBHOOK_SECRET || null,

  get baseUrl() {
    return this.environment === 'live'
      ? 'https://live.fapshi.com'
      : 'https://sandbox.fapshi.com';
  },
};

module.exports = fapshiConfig;
