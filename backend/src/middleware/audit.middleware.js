const auditService = require('../services/audit.service');

/**
 * auditMiddleware(action, tableName, getDetails?)
 *
 * Logs every successful write request to the audit trail (the source of truth
 * behind the dashboard "Recent Activities" feed).
 *
 * - `action`    — e.g. 'CREATE', 'UPDATE', 'DELETE', 'CONFIRM', 'PUBLISH'
 * - `tableName` — the affected entity, e.g. 'students', 'payments', 'grades'
 * - `getDetails` (optional) — `(req, data) => string|null`. Returns a
 *   human-readable label (student name, payment amount, ...) stored in
 *   audit_logs.details and shown in the dashboard activity feed.
 */
function auditMiddleware(action, tableName, getDetails) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode < 400 && body?.success) {
        const recordId =
          req.params?.id ||
          req.body?.id ||
          req.body?.paymentId ||
          req.body?.studentId ||
          body?.data?.id ||
          null;

        let details = null;
        if (typeof getDetails === 'function') {
          try {
            details = getDetails(req, body?.data) || null;
          } catch {
            details = null;
          }
        }

        auditService.log(
          req.schoolId || req.user?.schoolId,
          req.user?.userId,
          action,
          tableName,
          recordId,
          details
        ).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = auditMiddleware;
