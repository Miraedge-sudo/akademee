/**
 * Guardian Service — CRUD scoped to school_id (tenant isolation).
 */

const sql = require('../config/database');

class GuardianService {
  formatGuardian(row) {
    const parts = (row.name || '').split(' ');
    return {
      id: row.guardian_id,
      studentId: row.student_id,
      name: row.name,
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      relationship: row.relationship,
      phone: row.phone,
      email: row.email,
    };
  }

  async assertStudentInSchool(schoolId, studentId) {
    const rows = await sql`
      SELECT student_id FROM students WHERE student_id = ${studentId} AND school_id = ${schoolId}
    `;
    if (rows.length === 0) {
      throw new Error('Student not found in this school');
    }
  }

  async createGuardian(schoolId, data) {
    const { studentId, name, firstName, lastName, relationship, phone, email } = data;
    await this.assertStudentInSchool(schoolId, studentId);

    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();
    if (!fullName) {
      throw new Error('Guardian name is required');
    }

    const rows = await sql`
      INSERT INTO guardians (school_id, student_id, name, relationship, phone, email)
      VALUES (${schoolId}, ${studentId}, ${fullName}, ${relationship || 'guardian'}, ${phone || null}, ${email || null})
      RETURNING guardian_id, school_id, student_id, name, relationship, phone, email
    `;

    return this.formatGuardian(rows[0]);
  }

  async getGuardianById(schoolId, guardianId) {
    const rows = await sql`
      SELECT guardian_id, school_id, student_id, name, relationship, phone, email
      FROM guardians
      WHERE guardian_id = ${guardianId} AND school_id = ${schoolId}
    `;

    if (rows.length === 0) {
      throw new Error('Guardian not found');
    }

    return this.formatGuardian(rows[0]);
  }

  async listByStudent(schoolId, studentId) {
    await this.assertStudentInSchool(schoolId, studentId);

    const rows = await sql`
      SELECT guardian_id, school_id, student_id, name, relationship, phone, email
      FROM guardians
      WHERE school_id = ${schoolId} AND student_id = ${studentId}
      ORDER BY guardian_id ASC
    `;

    return rows.map((r) => this.formatGuardian(r));
  }

  async updateGuardian(schoolId, guardianId, data) {
    await this.getGuardianById(schoolId, guardianId);

    const { name, firstName, lastName, relationship, phone, email } = data;
    const fullName = name || (firstName || lastName ? `${firstName || ''} ${lastName || ''}`.trim() : null);

    const rows = await sql`
      UPDATE guardians SET
        name = COALESCE(${fullName}, name),
        relationship = COALESCE(${relationship || null}, relationship),
        phone = COALESCE(${phone ?? null}, phone),
        email = COALESCE(${email ?? null}, email)
      WHERE guardian_id = ${guardianId} AND school_id = ${schoolId}
      RETURNING guardian_id, school_id, student_id, name, relationship, phone, email
    `;

    return this.formatGuardian(rows[0]);
  }

  async listBySchool(schoolId, { limit = 50, offset = 0 } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT g.*, CONCAT(u.first_name, ' ', u.last_name) AS student_name
      FROM guardians g
      LEFT JOIN students st ON g.student_id = st.student_id
      LEFT JOIN users u ON st.user_id = u.user_id
      WHERE g.school_id = ${schoolId}
      ORDER BY g.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM guardians WHERE school_id = ${schoolId}
    `;

    return {
      guardians: rows.map(r => ({
        ...this.formatGuardian(r),
        studentName: r.student_name,
      })),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async deleteGuardian(schoolId, guardianId) {
    await this.getGuardianById(schoolId, guardianId);
    await sql`DELETE FROM guardians WHERE guardian_id = ${guardianId} AND school_id = ${schoolId}`;
    return { deleted: true, guardianId };
  }

  /**
   * Get the children (students) for a parent user.
   * A parent is linked to students via the guardians table.
   * This looks up guardians where email matches the current user's email,
   * then returns the associated students with their class info.
   */
  async getMyChildren(schoolId, userEmail) {
    const rows = await sql`
      SELECT
        st.student_id,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.first_name,
        u.last_name,
        st.student_number,
        st.photo_url,
        st.fee_status,
        st.class_label,
        c.class_id,
        c.name AS class_name,
        g.relationship AS parent_relationship
      FROM guardians g
      JOIN students st ON g.student_id = st.student_id
      JOIN users u ON st.user_id = u.user_id
      LEFT JOIN enrollments e ON e.student_id = st.student_id AND e.school_id = ${schoolId} AND e.status = 'active'
      LEFT JOIN classes c ON e.class_id = c.class_id
      WHERE g.school_id = ${schoolId}
        AND LOWER(g.email) = LOWER(${userEmail})
        AND st.status = 'active'
      ORDER BY u.first_name ASC
    `;
    return rows.map(r => ({
      id: r.student_id,
      firstName: r.first_name,
      lastName: r.last_name,
      fullName: r.full_name,
      studentNumber: r.student_number,
      photoUrl: r.photo_url,
      feeStatus: r.fee_status || 'pending',
      classLabel: r.class_label,
      classId: r.class_id,
      className: r.class_name,
      relationship: r.parent_relationship,
    }));
  }
}

module.exports = new GuardianService();
