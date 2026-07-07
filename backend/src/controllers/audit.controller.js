const response = require('../utils/response');
const auditService = require('../services/audit.service');

class AuditController {
  async list(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const { limit, offset, action, tableName } = req.query;
      const result = await auditService.list(schoolId, { limit, offset, action, tableName });
      response.success(res, 'Audit logs retrieved', result);
    } catch (error) { next(error); }
  }
}

module.exports = new AuditController();
