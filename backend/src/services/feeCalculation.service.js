const sql = require('../config/database');

class FeeCalculationService {
  async calculateStudentFeeStatus(schoolId, studentId) {
    const fees = await sql`
      SELECT COALESCE(SUM(f.amount), 0)::numeric AS total_fees
      FROM fees f
      LEFT JOIN class_subjects cs ON f.class_id = cs.class_id
      LEFT JOIN enrollments e ON cs.class_id = e.class_id
      WHERE e.student_id = ${studentId} AND e.school_id = ${schoolId} AND e.status = 'active'
    `;

    const totalFees = Number(fees[0]?.total_fees || 0);

    const payments = await sql`
      SELECT COALESCE(SUM(amount), 0)::numeric AS total_paid
      FROM payments
      WHERE student_id = ${studentId} AND school_id = ${schoolId} AND status = 'completed'
    `;

    const totalPaid = Number(payments[0]?.total_paid || 0);

    let status;
    if (totalFees === 0) {
      status = 'pending';
    } else if (totalPaid >= totalFees) {
      status = 'paid';
    } else if (totalPaid > 0) {
      status = 'partial';
    } else {
      status = 'pending';
    }

    return {
      studentId,
      totalFees,
      totalPaid,
      balance: totalFees - totalPaid,
      status,
    };
  }

  async updateAllStudentStatuses(schoolId) {
    const results = await sql`
      WITH student_fees_agg AS (
        SELECT
          e.student_id,
          COALESCE(SUM(f.amount), 0)::numeric AS total_fees
        FROM enrollments e
        LEFT JOIN class_subjects cs ON e.class_id = cs.class_id
        LEFT JOIN fees f ON cs.class_id = f.class_id
        WHERE e.school_id = ${schoolId} AND e.status = 'active'
        GROUP BY e.student_id
      ),
      student_payments_agg AS (
        SELECT
          student_id,
          COALESCE(SUM(amount), 0)::numeric AS total_paid
        FROM payments
        WHERE school_id = ${schoolId} AND status = 'completed'
        GROUP BY student_id
      ),
      updated AS (
        UPDATE students s SET fee_status =
          CASE
            WHEN COALESCE(sf.total_fees, 0) = 0 THEN 'pending'
            WHEN COALESCE(sp.total_paid, 0) >= COALESCE(sf.total_fees, 0) THEN 'paid'
            WHEN COALESCE(sp.total_paid, 0) > 0 THEN 'partial'
            ELSE 'pending'
          END
        FROM student_fees_agg sf
        LEFT JOIN student_payments_agg sp ON sf.student_id = sp.student_id
        WHERE s.student_id = sf.student_id AND s.school_id = ${schoolId}
        RETURNING s.student_id, s.fee_status,
          COALESCE(sf.total_fees, 0) AS total_fees,
          COALESCE(sp.total_paid, 0) AS total_paid
      )
      SELECT
        student_id,
        total_fees,
        total_paid,
        (total_fees - total_paid) AS balance,
        fee_status
      FROM updated
    `;
    return results.map(r => ({
      studentId: r.student_id,
      totalFees: Number(r.total_fees),
      totalPaid: Number(r.total_paid),
      balance: Number(r.balance),
      status: r.fee_status,
    }));
  }

  async getStudentFeeSummary(schoolId, studentId) {
    const feeStatus = await this.calculateStudentFeeStatus(schoolId, studentId);

    const payments = await sql`
      SELECT payment_id, amount, method, status, receipt_number, created_at
      FROM payments
      WHERE student_id = ${studentId} AND school_id = ${schoolId}
      ORDER BY created_at DESC
    `;

    const assignedFees = await sql`
      SELECT f.* FROM fees f
      JOIN class_subjects cs ON f.class_id = cs.class_id
      JOIN enrollments e ON cs.class_id = e.class_id
      WHERE e.student_id = ${studentId} AND e.school_id = ${schoolId} AND e.status = 'active'
    `;

    return {
      ...feeStatus,
      assignedFees: assignedFees.map(f => ({ id: f.fee_id, name: f.name, amount: Number(f.amount) })),
      payments: payments.map(p => ({
        id: p.payment_id,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
        receiptNumber: p.receipt_number,
        date: p.created_at,
      })),
    };
  }
}

module.exports = new FeeCalculationService();
