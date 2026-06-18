/**
 * School Resolver Middleware - Extract School from Subdomain
 */

const { resolveSubdomain } = require('../utils/domainHelper');

const schoolResolverMiddleware = (req, res, next) => {
  const subdomain = resolveSubdomain(req);

  if (subdomain) {
    req.subdomain = subdomain;
  }

  next();
};

module.exports = schoolResolverMiddleware;
