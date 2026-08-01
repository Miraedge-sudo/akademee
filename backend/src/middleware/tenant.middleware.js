/**
 * Tenant Middleware - Resolve school from subdomain and attach to request
 */

const sql = require('../config/database');
const { resolveSubdomain } = require('../utils/domainHelper');

const tenantMiddleware = async (req, res, next) => {
  try {
    if (req.user?.schoolId) {
      // The JWT already carries the tenant identity (schoolId + subdomain) —
      // no extra DB round trip is needed for authenticated requests.
      req.schoolId = req.user.schoolId;
      req.tenantId = req.user.schoolId;
      if (!req.subdomain && req.user.subdomain) {
        req.subdomain = req.user.subdomain;
      }

      return next();
    }

    const subdomain = req.subdomain || resolveSubdomain(req);

    if (subdomain) {
      const schools = await sql`
        SELECT
          s.school_id,
          s.name,
          s.subdomain,
          s.email,
          s.city,
          s.region,
          s.is_active,
          s.website_template_id,
          s.subscription_plan,
          s.tagline,
          s.primary_color,
          s.logo_url,
          s.hero_image_url,
          wt.template_code,
          wt.name AS template_name
        FROM schools s
        LEFT JOIN website_templates wt ON s.website_template_id = wt.template_id
        WHERE s.subdomain = ${subdomain} AND s.is_active = true
      `;

      if (schools.length > 0) {
        req.subdomain = subdomain;
        req.school = schools[0];
        req.schoolId = schools[0].school_id;
        req.tenantId = schools[0].school_id;
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resolving tenant.',
      error: error.message,
    });
  }
};

module.exports = tenantMiddleware;
