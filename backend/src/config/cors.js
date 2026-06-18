/**
 * CORS Configuration for Frontend Domains
 */

const domains = require('./domains');

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_PRODUCTION,
  ].filter(Boolean);

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();

    const tenantPatterns = [
      new RegExp(`\\.${domains.devTenantDomain.replace('.', '\\.')}$`),
      new RegExp(`\\.${domains.prodTenantDomain.replace('.', '\\.')}$`),
      /^localhost$/,
      /^127\.0\.0\.1$/,
    ];

    return tenantPatterns.some((pattern) => pattern.test(hostname));
  } catch {
    return false;
  }
}

const corsOptions = {
  origin(origin, callback) {
    if (process.env.NODE_ENV === 'development' || isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-School-Subdomain'],
  maxAge: 86400,
};

module.exports = corsOptions;
