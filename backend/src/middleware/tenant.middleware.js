/**
 * Tenant Middleware - Resolve school from subdomain and attach to request
 */

const sql = require('../config/database');
const { resolveSubdomain } = require('../utils/domainHelper');

const tenantMiddleware = async (req, res, next) => {
  try {
    if (req.user?.schoolId) {
      req.schoolId = req.user.schoolId;
      req.tenantId = req.user.schoolId;

      const schools = await sql`
        SELECT school_id, name, subdomain, email, city, region, is_active, website_template_id, subscription_plan
        FROM schools
        WHERE school_id = ${req.user.schoolId} AND is_active = true
      `;

      if (schools.length > 0) {
        req.school = schools[0];
        req.subdomain = schools[0].subdomain;
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
