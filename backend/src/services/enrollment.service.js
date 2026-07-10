const crypto = require('crypto');
const sql = require('../config/database');

class EnrollmentService {
  formatEnrollment(row) {
    return {
      id: row.enrollment_id,
      schoolId: row.school_id,
      studentId: row.student_id,
      studentName: row.student_name,
      classId: row.class_id,
      className: row.class_name,
      academicYearId: row.academic_year_id,
      status: row.status,
      enrollmentNumber: row.enrollment_number,
      enrolledAt: row.created_at,
    };
  }

  async assertStudentInSchool(schoolId, studentId) {
    const rows = await sql`SELECT student_id FROM students WHERE student_id = ${studentId} AND school_id = ${schoolId}`;
    if (rows.length === 0) throw new Error('Student not found in this school');
  }

  async assertClassInSchool(schoolId, classId) {
    const rows = await sql`SELECT class_id, capacity FROM classes WHERE class_id = ${classId} AND school_id = ${schoolId}`;
    if (rows.length === 0) throw new Error('Class not found in this school');
    return rows[0];
  }

  async checkCapacity(schoolId, classId) {
    const cls = await this.assertClassInSchool(schoolId, classId);
    if (!cls.capacity) return true;

    const count = await sql`
      SELECT COUNT(*)::int AS total FROM enrollments
      WHERE class_id = ${classId} AND school_id = ${schoolId} AND status = 'active'
    `;
    if (count[0].total >= cls.capacity) {
      throw new Error(`Class has reached maximum capacity (${cls.capacity} students)`);
    }
    return true;
  }

  async create(schoolId, data) {
    const { studentId, classId, academicYearId } = data;
    await this.assertStudentInSchool(schoolId, studentId);
    await this.checkCapacity(schoolId, classId);

    const existing = await sql`
      SELECT enrollment_id FROM enrollments
      WHERE student_id = ${studentId} AND class_id = ${classId} AND school_id = ${schoolId} AND status = 'active'
    `;
    if (existing.length > 0) throw new Error('Student is already enrolled in this class');

    const number = `ENR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const rows = await sql`
      INSERT INTO enrollments (school_id, student_id, class_id, academic_year_id, enrollment_number, status)
      VALUES (${schoolId}, ${studentId}, ${classId}, ${academicYearId || null}, ${number}, 'active')
      RETURNING *
    `;
    return this.formatEnrollment(rows[0]);
  }

  async getById(schoolId, enrollmentId) {
    const rows = await sql`
      SELECT e.*, CONCAT(u.first_name, ' ', u.last_name) AS student_name, c.name AS class_name
      FROM enrollments e
      JOIN students st ON e.student_id = st.student_id
      JOIN users u ON st.user_id = u.user_id
      LEFT JOIN classes c ON e.class_id = c.class_id
      WHERE e.enrollment_id = ${enrollmentId} AND e.school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Enrollment not found');
    return this.formatEnrollment(rows[0]);
  }

  async listBySchool(schoolId, { classId, status, limit = 50, offset = 0 } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT e.*, CONCAT(u.first_name, ' ', u.last_name) AS student_name, c.name AS class_name
      FROM enrollments e
      JOIN students st ON e.student_id = st.student_id
      JOIN users u ON st.user_id = u.user_id
      LEFT JOIN classes c ON e.class_id = c.class_id
      WHERE e.school_id = ${schoolId}
        ${classId ? sql`AND e.class_id = ${classId}` : sql``}
        ${status ? sql`AND e.status = ${status}` : sql``}
      ORDER BY e.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM enrollments e
      WHERE e.school_id = ${schoolId}
        ${classId ? sql`AND e.class_id = ${classId}` : sql``}
        ${status ? sql`AND e.status = ${status}` : sql``}
    `;

    return {
      enrollments: rows.map(r => this.formatEnrollment(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async listByStudent(schoolId, studentId) {
    await this.assertStudentInSchool(schoolId, studentId);
    const rows = await sql`
      SELECT e.*, c.name AS class_name
      FROM enrollments e
      LEFT JOIN classes c ON e.class_id = c.class_id
      WHERE e.student_id = ${studentId} AND e.school_id = ${schoolId}
      ORDER BY e.created_at DESC
    `;
    return rows.map(r => this.formatEnrollment(r));
  }

  async updateStatus(schoolId, enrollmentId, status) {
    await this.getById(schoolId, enrollmentId);
    const rows = await sql`
      UPDATE enrollments SET status = ${status}, updated_at = NOW()
      WHERE enrollment_id = ${enrollmentId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatEnrollment(rows[0]);
  }

  async transfer(schoolId, enrollmentId, newClassId) {
    const enrollment = await this.getById(schoolId, enrollmentId);
    await this.checkCapacity(schoolId, newClassId);

    await sql`UPDATE enrollments SET status = 'transferred', updated_at = NOW() WHERE enrollment_id = ${enrollmentId}`;

    const rows = await sql`
      INSERT INTO enrollments (school_id, student_id, class_id, academic_year_id, status)
      VALUES (${schoolId}, ${enrollment.studentId}, ${newClassId}, ${enrollment.academicYearId}, 'active')
      RETURNING *
    `;
    return this.formatEnrollment(rows[0]);
  }

  async delete(schoolId, enrollmentId) {
    await this.getById(schoolId, enrollmentId);
    await sql`DELETE FROM enrollments WHERE enrollment_id = ${enrollmentId} AND school_id = ${schoolId}`;
    return { deleted: true, enrollmentId };
  }

  async removeFromClass(schoolId, studentId, classId) {
    const rows = await sql`
      UPDATE enrollments SET status = 'withdrawn', updated_at = NOW()
      WHERE student_id = ${studentId} AND class_id = ${classId}
        AND school_id = ${schoolId} AND status = 'active'
      RETURNING *
    `;
    if (rows.length === 0) throw new Error('No active enrollment found for this student in this class');
    return this.formatEnrollment(rows[0]);
  }
}

module.exports = new EnrollmentService();
