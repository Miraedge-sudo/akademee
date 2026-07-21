/**
 * Multi-tenant domain configuration
 *
 * Development: {subdomain}.lvh.me:{FRONTEND_PORT}  (wildcard → 127.0.0.1)
 * Production:  {subdomain}.akademee.com
 */

const isProduction = process.env.NODE_ENV === 'production';

const domains = {
  isProduction,
  isDevelopment: !isProduction,

  /** Wildcard dev domain (lvh.me resolves to 127.0.0.1) */
  devTenantDomain: process.env.TENANT_DEV_DOMAIN || 'lvh.me',

  /** Production tenant domain */
  prodTenantDomain: process.env.TENANT_PROD_DOMAIN || 'akademee.com',

  /** Frontend port in development */
  frontendPort: process.env.FRONTEND_PORT || '3001',

  /** Backend API base URL */
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:5000',

  /** Subdomains reserved for platform services (not schools) */
  reservedSubdomains: [
    'www', 'api', 'app', 'admin', 'mail', 'static', 'auth', 'dev', 'stage',
    'test', 'cdn', 'status', 'support', 'help', 'docs', 'blog', 'shop',
    'store', 'web', 'beta', 'demo', 'secure', 'portal', 'console',
    'dashboard', 'smtp', 'imap', 'pop3', 'webmail', 'ftp', 'git',
  ],

  getActiveTenantDomain() {
    return isProduction ? this.prodTenantDomain : this.devTenantDomain;
  },

  getDomainSuffix() {
    const domain = this.getActiveTenantDomain();
    if (isProduction) {
      return `.${domain}`;
    }
    return `.${domain}:${this.frontendPort}`;
  },

  getProtocol() {
    return isProduction ? 'https' : 'http';
  },
};

module.exports = domains;
