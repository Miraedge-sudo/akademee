/**
 * School Resolver Middleware - Extract School from Subdomain
 * Priority: 1) JWT subdomain (authenticated) 2) Host header 3) Other client sources
 */

const { resolveSubdomain } = require('../utils/domainHelper');

const schoolResolverMiddleware = (req, res, next) => {
  const subdomain = resolveSubdomain(req);

  if (subdomain && !req.subdomain) {
    req.subdomain = subdomain;
  }

  next();
};

module.exports = schoolResolverMiddleware;
