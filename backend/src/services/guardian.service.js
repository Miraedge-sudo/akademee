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

  async deleteGuardian(schoolId, guardianId) {
    await this.getGuardianById(schoolId, guardianId);
    await sql`DELETE FROM guardians WHERE guardian_id = ${guardianId} AND school_id = ${schoolId}`;
    return { deleted: true, guardianId };
  }
}

module.exports = new GuardianService();
