const sql = require('../config/database');

class StudentFeeService {
  formatStudentFee(row) {
    return {
      id: row.student_fee_id,
      schoolId: row.school_id,
      studentId: row.student_id,
      feeId: row.fee_id,
      feeName: row.fee_name,
      amountDue: Number(row.amount_due),
      amountPaid: Number(row.amount_paid),
      status: row.status,
      dueDate: row.due_date || null,
      academicYearId: row.academic_year_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async assignFeesToStudent(schoolId, studentId, feeIds, academicYearId) {
    if (!feeIds || feeIds.length === 0) return [];

    const yearFilter = academicYearId
      ? sql`sf.academic_year_id = ${academicYearId}`
      : sql`sf.academic_year_id IS NULL`;

    const rows = await sql`
      WITH valid_fees AS (
        SELECT fee_id, amount FROM fees
        WHERE fee_id = ANY(${feeIds}) AND school_id = ${schoolId}
      ),
      new_rows AS (
        INSERT INTO student_fees (school_id, student_id, fee_id, amount_due, academic_year_id)
        SELECT ${schoolId}, ${studentId}, vf.fee_id, COALESCE(vf.amount, 0), ${academicYearId || null}
        FROM valid_fees vf
        WHERE NOT EXISTS (
          SELECT 1 FROM student_fees sf
          WHERE sf.student_id = ${studentId}
            AND sf.fee_id = vf.fee_id
            AND ${yearFilter}
        )
        RETURNING *
      ),
      existing AS (
        SELECT sf.* FROM student_fees sf
        WHERE sf.student_id = ${studentId}
          AND sf.fee_id IN (SELECT fee_id FROM valid_fees)
          AND ${yearFilter}
      )
      SELECT * FROM new_rows
      UNION ALL
      SELECT * FROM existing
    `;
    return rows.map(r => this.formatStudentFee(r));
  }

  async assignFeesToClass(schoolId, classId, feeIds, academicYearId) {
    if (!feeIds || feeIds.length === 0) return [];

    const yearFilter = academicYearId
      ? sql`sf.academic_year_id = ${academicYearId}`
      : sql`sf.academic_year_id IS NULL`;

    const rows = await sql`
      WITH class_students AS (
        SELECT DISTINCT student_id FROM enrollments
        WHERE class_id = ${classId} AND school_id = ${schoolId} AND status = 'active'
      ),
      valid_fees AS (
        SELECT fee_id, amount FROM fees
        WHERE fee_id = ANY(${feeIds}) AND school_id = ${schoolId}
      ),
      new_rows AS (
        INSERT INTO student_fees (school_id, student_id, fee_id, amount_due, academic_year_id)
        SELECT ${schoolId}, cs.student_id, vf.fee_id, COALESCE(vf.amount, 0), ${academicYearId || null}
        FROM class_students cs
        CROSS JOIN valid_fees vf
        WHERE NOT EXISTS (
          SELECT 1 FROM student_fees sf
          WHERE sf.student_id = cs.student_id
            AND sf.fee_id = vf.fee_id
            AND ${yearFilter}
        )
        RETURNING *
      ),
      existing AS (
        SELECT sf.* FROM student_fees sf
        WHERE sf.student_id IN (SELECT student_id FROM class_students)
          AND sf.fee_id IN (SELECT fee_id FROM valid_fees)
          AND ${yearFilter}
      )
      SELECT * FROM new_rows
      UNION ALL
      SELECT * FROM existing
    `;
    return rows.map(r => this.formatStudentFee(r));
  }

  async listByClass(schoolId, classId, academicYearId) {
    const rows = await sql`
      SELECT DISTINCT sf.fee_id, f.name AS fee_name, f.amount
      FROM student_fees sf
      JOIN fees f ON sf.fee_id = f.fee_id
      JOIN enrollments e ON sf.student_id = e.student_id AND e.class_id = ${classId} AND e.school_id = ${schoolId} AND e.status = 'active'
      WHERE sf.school_id = ${schoolId}
        ${academicYearId ? sql`AND sf.academic_year_id = ${academicYearId}` : sql`AND sf.academic_year_id IS NULL`}
      ORDER BY f.name ASC
    `;
    return rows.map(r => ({
      feeId: r.fee_id,
      feeName: r.fee_name,
      amount: Number(r.amount),
    }));
  }

  async listByStudent(schoolId, studentId) {
    const rows = await sql`
      SELECT sf.*, f.name AS fee_name, f.due_date
      FROM student_fees sf
      JOIN fees f ON sf.fee_id = f.fee_id
      WHERE sf.student_id = ${studentId} AND sf.school_id = ${schoolId}
      ORDER BY sf.created_at DESC
    `;
    return rows.map(r => this.formatStudentFee(r));
  }

  async getSummary(schoolId, studentId) {
    const fees = await sql`
      SELECT COALESCE(SUM(amount_due), 0)::numeric AS total_due,
             COALESCE(SUM(amount_paid), 0)::numeric AS total_paid
      FROM student_fees
      WHERE student_id = ${studentId} AND school_id = ${schoolId}
    `;
    const totalDue = Number(fees[0]?.total_due || 0);
    const totalPaid = Number(fees[0]?.total_paid || 0);

    let status = 'pending';
    if (totalDue === 0) status = 'none';
    else if (totalPaid >= totalDue) status = 'paid';
    else if (totalPaid > 0) status = 'partial';

    return { totalDue, totalPaid, balance: totalDue - totalPaid, status };
  }

  async updatePayment(schoolId, studentId, feeId, amount, academicYearId) {
    const rows = await sql`
      UPDATE student_fees SET
        amount_paid = amount_paid + ${amount},
        status = CASE WHEN (amount_paid + ${amount}) >= amount_due THEN 'paid' ELSE 'partial' END,
        updated_at = NOW()
      WHERE student_id = ${studentId} AND fee_id = ${feeId}
        AND academic_year_id = ${academicYearId || null} AND school_id = ${schoolId}
      RETURNING *
    `;
    return rows.length > 0 ? this.formatStudentFee(rows[0]) : null;
  }
}

module.exports = new StudentFeeService();
