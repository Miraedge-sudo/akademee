const response = require('../utils/response');
const websiteService = require('../services/website.service');

class WebsiteController {
  async getWebsiteData(req, res, next) {
    try {
      if (!req.subdomain) {
        return response.error(
          res,
          'School subdomain is required. Access via {school}.lvh.me or pass ?subdomain= or X-School-Subdomain header.',
          null,
          400
        );
      }

      if (!req.schoolId) {
        return response.error(res, 'School not found for this subdomain', null, 404);
      }

      const data = await websiteService.getPublicWebsiteBySubdomain(req.subdomain);

      if (req.user?.schoolId && data.schoolId !== req.user.schoolId) {
        return response.error(res, 'Access denied. Tenant mismatch.', null, 403);
      }

      response.success(res, 'Website data retrieved', data);
    } catch (error) {
      if (error.message === 'School website not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async updateWebsiteTemplate(req, res, next) {
    try {
      const { templateId } = req.body;
      const schoolId = req.schoolId || req.user?.schoolId;

      if (!templateId) {
        return response.error(res, 'templateId is required', null, 400);
      }

      const sql = require('../config/database');
      const rows = await sql`
        UPDATE schools SET website_template_id = ${templateId}, updated_at = NOW()
        WHERE school_id = ${schoolId}
        RETURNING school_id, website_template_id
      `;

      if (rows.length === 0) {
        return response.error(res, 'School not found', null, 404);
      }

      response.success(res, 'Template updated', { schoolId: rows[0].school_id, templateId: rows[0].website_template_id });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WebsiteController();
