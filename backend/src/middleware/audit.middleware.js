const auditService = require('../services/audit.service');

function auditMiddleware(action, tableName) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode < 400 && body?.success) {
        const recordId = req.params?.id || req.body?.id || null;
        auditService.log(
          req.schoolId || req.user?.schoolId,
          req.user?.userId,
          action,
          tableName,
          recordId
        ).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = auditMiddleware;
