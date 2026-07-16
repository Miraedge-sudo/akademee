/**
 * Student Service — CRUD scoped strictly to school_id (tenant isolation).
 * School A can never read or mutate School B students.
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sql = require('../config/database');

class StudentService {
  formatStudent(row) {
    const firstName = row.first_name || '';
    const lastName = row.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const initials = fullName
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0].toUpperCase())
      .slice(0, 2)
      .join('');

    return {
      id: row.student_id,
      userId: row.user_id,
      studentNumber: row.student_number,
      firstName,
      lastName,
      fullName,
      email: row.email,
      phone: row.phone,
      className: row.class_label,
      classId: row.class_id, // from enrollments via LEFT JOIN
      dateOfBirth: row.date_of_birth,
      gender: row.gender,
      status: row.status,
      feeStatus: row.fee_status || 'pending',
      photoUrl: row.photo_url,
      enrolledAt: row.created_at,
      initials,
    };
  }

  studentSelectQuery(schoolId, extraWhere = sql``) {
    return sql`
      SELECT
        st.student_id, st.user_id, st.student_number, st.registration_number,
        st.date_of_birth, st.gender, st.status, st.photo_url, st.class_label,
        st.fee_status, st.created_at,
        u.first_name, u.last_name, u.email, u.phone,
        (SELECT e.class_id FROM enrollments e WHERE e.student_id = st.student_id AND e.status = 'active' LIMIT 1) AS class_id
      FROM students st
      INNER JOIN users u ON st.user_id = u.user_id
      WHERE st.school_id = ${schoolId}
      ${extraWhere}
    `;
  }

  async createStudent(schoolId, data) {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      className,
      classId,
      dateOfBirth,
      gender = 'male',
      studentNumber,
      status = 'active',
      feeStatus = 'pending',
    } = data;

    // ── Reuse existing user if email already exists in this school ──
    let user;
    if (email) {
      const existing = await sql`
        SELECT user_id, first_name, last_name, email, phone
        FROM users
        WHERE email = ${email} AND school_id = ${schoolId}
        LIMIT 1
      `;
      if (existing.length > 0) {
        user = existing[0];
        // Update the existing user's name/phone in case they changed
        const passwordHash = password ? await bcrypt.hash(password, 10) : null;
        await sql`
          UPDATE users SET
            first_name = ${firstName},
            last_name = ${lastName},
            phone = COALESCE(${phone || null}, phone),
            ${passwordHash ? sql`password_hash = ${passwordHash},` : sql``}
            is_active = true,
            updated_at = NOW()
          WHERE user_id = ${user.user_id} AND school_id = ${schoolId}
        `;
      }
    }

    if (!user) {
      const pwdHash = password ? await bcrypt.hash(password, 10) : null;
      const users = await sql`
        INSERT INTO users (school_id, first_name, last_name, email, phone, password_hash, is_active, created_at)
        VALUES (
          ${schoolId}, ${firstName}, ${lastName},
          ${email || null}, ${phone || null}, ${pwdHash}, true, NOW()
        )
        RETURNING user_id, first_name, last_name, email, phone
      `;
      user = users[0];
    }

    // ── Assign STUDENT role ──
    const studentRole = await sql`SELECT role_id FROM roles WHERE role_code = 'STUDENT' LIMIT 1`;
    if (studentRole.length > 0) {
      await sql`
        INSERT INTO user_roles (user_id, role_id)
        VALUES (${user.user_id}, ${studentRole[0].role_id})
        ON CONFLICT DO NOTHING
      `;
    }

    const number = studentNumber || `STU-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const students = await sql`
      INSERT INTO students (
        school_id, user_id, student_number, date_of_birth, gender,
        status, class_label, fee_status, created_at
      )
      VALUES (
        ${schoolId}, ${user.user_id}, ${number},
        ${dateOfBirth || null}, ${gender}, ${status},
        ${className || null}, ${feeStatus}, NOW()
      )
      RETURNING student_id
    `;

    // Optional enrollment when classId UUID is provided
    if (classId) {
      await sql`
        INSERT INTO enrollments (school_id, student_id, class_id, status)
        VALUES (${schoolId}, ${students[0].student_id}, ${classId}, 'active')
      `;
    }

    const rows = await this.studentSelectQuery(
      schoolId,
      sql`AND st.student_id = ${students[0].student_id}`
    );

    return this.formatStudent(rows[0]);
  }

  async getStudentById(schoolId, studentId) {
    const rows = await this.studentSelectQuery(
      schoolId,
      sql`AND st.student_id = ${studentId}`
    );

    if (rows.length === 0) {
      throw new Error('Student not found');
    }

    return this.formatStudent(rows[0]);
  }

  async listStudents(schoolId, { limit = 50, offset = 0, search, status, className } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);
    const searchTerm = search ? `%${search.toLowerCase()}%` : null;

    const rows = await sql`
      SELECT
        st.student_id, st.user_id, st.student_number, st.registration_number,
        st.date_of_birth, st.gender, st.status, st.photo_url, st.class_label,
        st.fee_status, st.created_at,
        u.first_name, u.last_name, u.email, u.phone,
        (SELECT e.class_id FROM enrollments e WHERE e.student_id = st.student_id AND e.status = 'active' LIMIT 1) AS class_id
      FROM students st
      INNER JOIN users u ON st.user_id = u.user_id
      WHERE st.school_id = ${schoolId}
        ${status ? sql`AND st.status = ${status}` : sql``}
        ${className ? sql`AND st.class_label = ${className}` : sql``}
        ${searchTerm
          ? sql`AND (
              LOWER(u.first_name) LIKE ${searchTerm}
              OR LOWER(u.last_name) LIKE ${searchTerm}
              OR LOWER(st.student_number) LIKE ${searchTerm}
            )`
          : sql``}
      ORDER BY st.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM students st
      INNER JOIN users u ON st.user_id = u.user_id
      WHERE st.school_id = ${schoolId}
        ${status ? sql`AND st.status = ${status}` : sql``}
        ${className ? sql`AND st.class_label = ${className}` : sql``}
        ${searchTerm
          ? sql`AND (
              LOWER(u.first_name) LIKE ${searchTerm}
              OR LOWER(u.last_name) LIKE ${searchTerm}
              OR LOWER(st.student_number) LIKE ${searchTerm}
            )`
          : sql``}
    `;

    return {
      students: rows.map((r) => this.formatStudent(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async updateStudent(schoolId, studentId, data) {
    await this.getStudentById(schoolId, studentId);

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      className,
      dateOfBirth,
      gender,
      status,
      feeStatus,
      studentNumber,
    } = data;

    const studentRows = await sql`
      SELECT user_id FROM students WHERE student_id = ${studentId} AND school_id = ${schoolId}
    `;

    const userId = studentRows[0].user_id;

    if (firstName || lastName || email !== undefined || phone !== undefined || password) {
      const passwordHash = password ? await bcrypt.hash(password, 10) : null;
      await sql`
        UPDATE users SET
          first_name = COALESCE(${firstName || null}, first_name),
          last_name = COALESCE(${lastName || null}, last_name),
          email = COALESCE(${email ?? null}, email),
          phone = COALESCE(${phone ?? null}, phone),
          ${passwordHash ? sql`password_hash = ${passwordHash},` : sql``}
          updated_at = NOW()
        WHERE user_id = ${userId} AND school_id = ${schoolId}
      `;
    }

    await sql`
      UPDATE students SET
        student_number = COALESCE(${studentNumber || null}, student_number),
        date_of_birth = COALESCE(${dateOfBirth ?? null}, date_of_birth),
        gender = COALESCE(${gender || null}, gender),
        status = COALESCE(${status || null}, status),
        class_label = COALESCE(${className ?? null}, class_label),
        fee_status = COALESCE(${feeStatus || null}, fee_status)
      WHERE student_id = ${studentId} AND school_id = ${schoolId}
    `;

    return this.getStudentById(schoolId, studentId);
  }

  async deleteStudent(schoolId, studentId) {
    await this.getStudentById(schoolId, studentId);

    const rows = await sql`
      SELECT user_id FROM students WHERE student_id = ${studentId} AND school_id = ${schoolId}
    `;

    await sql`UPDATE students SET status = 'inactive', updated_at = NOW() WHERE student_id = ${studentId} AND school_id = ${schoolId}`;
    await sql`UPDATE users SET is_active = false, updated_at = NOW() WHERE user_id = ${rows[0].user_id} AND school_id = ${schoolId}`;

    return { deleted: true, studentId };
  }
}

module.exports = new StudentService();
