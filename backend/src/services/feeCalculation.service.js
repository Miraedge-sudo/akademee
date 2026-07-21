const sql = require('../config/database');

class FeeCalculationService {
  async calculateStudentFeeStatus(schoolId, studentId) {
    // Read fees from student_fees (the actual fee assignments) rather than
    // the fees → class_subjects → enrollments path, because fees may be
    // assigned directly via assignFeesToClass / assignFeesToStudent.
    const studentFees = await sql`
      SELECT
        COALESCE(SUM(amount_due), 0)::numeric AS total_fees,
        COALESCE(SUM(amount_paid), 0)::numeric AS total_paid
      FROM student_fees
      WHERE student_id = ${studentId} AND school_id = ${schoolId}
    `;

    const totalFees = Number(studentFees[0]?.total_fees || 0);
    const totalPaid = Number(studentFees[0]?.total_paid || 0);

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
          student_id,
          school_id,
          COALESCE(SUM(amount_due), 0)::numeric AS total_fees,
          COALESCE(SUM(amount_paid), 0)::numeric AS total_paid
        FROM student_fees
        WHERE school_id = ${schoolId}
        GROUP BY student_id, school_id
      ),
      updated AS (
        UPDATE students s SET fee_status =
          CASE
            WHEN COALESCE(sf.total_fees, 0) = 0 THEN 'pending'
            WHEN COALESCE(sf.total_paid, 0) >= COALESCE(sf.total_fees, 0) THEN 'paid'
            WHEN COALESCE(sf.total_paid, 0) > 0 THEN 'partial'
            ELSE 'pending'
          END
        FROM student_fees_agg sf
        WHERE s.student_id = sf.student_id AND s.school_id = sf.school_id
        RETURNING s.student_id, s.fee_status,
          COALESCE(sf.total_fees, 0) AS total_fees,
          COALESCE(sf.total_paid, 0) AS total_paid
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

    // Read assigned fees from student_fees (the actual assignments)
    const assignedFees = await sql`
      SELECT sf.*, f.name AS fee_name, f.due_date
      FROM student_fees sf
      JOIN fees f ON sf.fee_id = f.fee_id
      WHERE sf.student_id = ${studentId} AND sf.school_id = ${schoolId}
      ORDER BY f.name ASC
    `;

    return {
      ...feeStatus,
      assignedFees: assignedFees.map(f => ({
        id: f.fee_id,
        studentFeeId: f.student_fee_id,
        name: f.fee_name || f.name,
        amount: Number(f.amount_due),
        amountPaid: Number(f.amount_paid),
        status: f.status,
        dueDate: f.due_date || null,
      })),
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
