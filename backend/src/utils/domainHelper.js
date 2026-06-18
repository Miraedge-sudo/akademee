/**
 * Domain helpers — parse tenant subdomain and build school URLs
 */

const domains = require('../config/domains');
const SlugGenerator = require('./slugGenerator');

/** Maps each school's chosen template to its public landing page file */
const TEMPLATE_PAGES = {
  modern: 'akademee_vitrine_modern.html',
  classic: 'akademee_vitrine_classic.html',
  minimal: 'akademee_vitrine_minimal.html',
};

function stripPort(host = '') {
  return host.split(':')[0].toLowerCase();
}

function escapeRegex(value) {
  return value.replace(/\./g, '\\.');
}

function parseSubdomainFromHost(host) {
  if (!host) {
    return null;
  }

  const hostname = stripPort(host);
  const devDomain = domains.devTenantDomain;
  const prodDomain = domains.prodTenantDomain;

  const patterns = [
    new RegExp(`^([a-z0-9-]+)\\.${escapeRegex(devDomain)}$`),
    new RegExp(`^([a-z0-9-]+)\\.${escapeRegex(prodDomain)}$`),
  ];

  for (const pattern of patterns) {
    const match = hostname.match(pattern);
    if (match && !domains.reservedSubdomains.includes(match[1])) {
      return match[1];
    }
  }

  return null;
}

function resolveSubdomain(req) {
  if (req.subdomain) {
    return SlugGenerator.sanitize(req.subdomain);
  }

  const headerSubdomain = req.headers['x-school-subdomain'];
  if (headerSubdomain) {
    return SlugGenerator.sanitize(headerSubdomain);
  }

  const hostSubdomain = parseSubdomainFromHost(req.get('host'));
  if (hostSubdomain) {
    return hostSubdomain;
  }

  if (req.query?.subdomain) {
    return SlugGenerator.sanitize(req.query.subdomain);
  }

  if (req.body?.subdomain) {
    return SlugGenerator.sanitize(req.body.subdomain);
  }

  return req.subdomain || null;
}

function buildSchoolUrls(subdomain, templateCode = 'modern') {
  const normalizedSubdomain = SlugGenerator.sanitize(subdomain);
  const protocol = domains.getProtocol();
  const activeDomain = domains.getActiveTenantDomain();
  const host = domains.isProduction
    ? `${normalizedSubdomain}.${activeDomain}`
    : `${normalizedSubdomain}.${activeDomain}:${domains.frontendPort}`;

  const vitrinePage = TEMPLATE_PAGES[templateCode] || TEMPLATE_PAGES.modern;

  return {
    subdomain: normalizedSubdomain,
    campusUrl: `${protocol}://${host}`,
    dashboardUrl: `${protocol}://${host}/pages/akademee_layout.html`,
    websiteUrl: `${protocol}://${host}/pages/${vitrinePage}`,
    loginUrl: `${protocol}://${host}/pages/akademee_login.html`,
    onboardingUrl: `${protocol}://${host}/pages/akademee_onboarding_v2.html`,
    verifyEmailUrl: `${protocol}://${host}/pages/akademee_verify_email.html`,
    apiUrl: domains.apiBaseUrl,
    domainSuffix: domains.getDomainSuffix(),
    templateCode,
  };
}

function getPublicDomainConfig() {
  return {
    environment: domains.isProduction ? 'production' : 'development',
    tenantDomain: domains.getActiveTenantDomain(),
    domainSuffix: domains.getDomainSuffix(),
    apiBaseUrl: domains.apiBaseUrl,
    frontendPort: domains.frontendPort,
    protocol: domains.getProtocol(),
    templatePages: TEMPLATE_PAGES,
  };
}

module.exports = {
  parseSubdomainFromHost,
  resolveSubdomain,
  buildSchoolUrls,
  getPublicDomainConfig,
  TEMPLATE_PAGES,
};
