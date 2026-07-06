const crypto = require('crypto');
const sql = require('../config/database');

class PaymentService {
  formatPayment(row) {
    return {
      id: row.payment_id,
      schoolId: row.school_id,
      studentId: row.student_id,
      studentName: row.student_name,
      amount: Number(row.amount),
      method: row.method,
      status: row.status,
      reference: row.receipt_number,
      feeId: row.fee_id,
      createdAt: row.created_at,
    };
  }

  async create(schoolId, data) {
    const { studentId, amount, method, feeId, reference } = data;
    const receiptNumber = reference || `RCP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const rows = await sql`
      INSERT INTO payments (school_id, student_id, amount, method, status, receipt_number)
      VALUES (${schoolId}, ${studentId}, ${amount}, ${method || 'cash'}, 'completed', ${receiptNumber})
      RETURNING *
    `;
    return this.formatPayment(rows[0]);
  }

  async getById(schoolId, paymentId) {
    const rows = await sql`
      SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) AS student_name
      FROM payments p
      LEFT JOIN students st ON p.student_id = st.student_id
      LEFT JOIN users u ON st.user_id = u.user_id
      WHERE p.payment_id = ${paymentId} AND p.school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Payment not found');
    return this.formatPayment(rows[0]);
  }

  async listBySchool(schoolId, { limit = 50, offset = 0, status, startDate, endDate } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) AS student_name
      FROM payments p
      LEFT JOIN students st ON p.student_id = st.student_id
      LEFT JOIN users u ON st.user_id = u.user_id
      WHERE p.school_id = ${schoolId}
        ${status ? sql`AND p.status = ${status}` : sql``}
        ${startDate ? sql`AND p.created_at >= ${startDate}` : sql``}
        ${endDate ? sql`AND p.created_at <= ${endDate}` : sql``}
      ORDER BY p.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM payments p
      WHERE p.school_id = ${schoolId}
        ${status ? sql`AND p.status = ${status}` : sql``}
        ${startDate ? sql`AND p.created_at >= ${startDate}` : sql``}
        ${endDate ? sql`AND p.created_at <= ${endDate}` : sql``}
    `;

    return {
      payments: rows.map(r => this.formatPayment(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async listByStudent(schoolId, studentId) {
    const rows = await sql`
      SELECT p.*
      FROM payments p
      WHERE p.school_id = ${schoolId} AND p.student_id = ${studentId}
      ORDER BY p.created_at DESC
    `;
    return rows.map(r => this.formatPayment(r));
  }

  async confirm(schoolId, reference) {
    const rows = await sql`
      UPDATE payments SET status = 'completed'
      WHERE receipt_number = ${reference} AND school_id = ${schoolId}
      RETURNING *
    `;
    if (rows.length === 0) throw new Error('Payment not found');
    return this.formatPayment(rows[0]);
  }

  async generateReport(schoolId, { startDate, endDate } = {}) {
    const rows = await sql`
      SELECT p.*, CONCAT(u.first_name, ' ', u.last_name) AS student_name
      FROM payments p
      LEFT JOIN students st ON p.student_id = st.student_id
      LEFT JOIN users u ON st.user_id = u.user_id
      WHERE p.school_id = ${schoolId}
        AND p.status = 'completed'
        ${startDate ? sql`AND p.created_at >= ${startDate}` : sql``}
        ${endDate ? sql`AND p.created_at <= ${endDate}` : sql``}
      ORDER BY p.created_at ASC
    `;

    const totalAmount = rows.reduce((sum, r) => sum + Number(r.amount), 0);

    return {
      payments: rows.map(r => this.formatPayment(r)),
      totalAmount,
      count: rows.length,
      startDate,
      endDate,
    };
  }
}

module.exports = new PaymentService();
