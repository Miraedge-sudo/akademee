const sql = require('../config/database');

class AuditService {
  async log(schoolId, userId, action, tableName, recordId) {
    await sql`
      INSERT INTO audit_logs (school_id, user_id, action, table_name, record_id)
      VALUES (${schoolId || null}, ${userId || null}, ${action}, ${tableName || null}, ${recordId || null})
    `;
    return { logged: true };
  }

  async list(schoolId, { limit = 50, offset = 0, action, tableName } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT al.*, CONCAT(u.first_name, ' ', u.last_name) AS user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      WHERE al.school_id = ${schoolId}
        ${action ? sql`AND al.action = ${action}` : sql``}
        ${tableName ? sql`AND al.table_name = ${tableName}` : sql``}
      ORDER BY al.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM audit_logs WHERE school_id = ${schoolId}
        ${action ? sql`AND action = ${action}` : sql``}
        ${tableName ? sql`AND table_name = ${tableName}` : sql``}
    `;

    return {
      logs: rows.map(r => ({
        id: r.log_id,
        schoolId: r.school_id,
        userId: r.user_id,
        userName: r.user_name,
        action: r.action,
        tableName: r.table_name,
        recordId: r.record_id,
        createdAt: r.created_at,
      })),
      total: countRows[0].total,
      limit,
      offset,
    };
  }
}

module.exports = new AuditService();
