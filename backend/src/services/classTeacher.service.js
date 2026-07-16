const sql = require('../config/database');

class ClassTeacherService {
  format(row) {
    return {
      id: row.class_teacher_id,
      schoolId: row.school_id,
      classId: row.class_id,
      className: row.class_name,
      teacherId: row.teacher_id,
      teacherFirstName: row.teacher_first_name,
      teacherLastName: row.teacher_last_name,
      teacherEmail: row.teacher_email,
      isMain: row.is_main || false,
      createdAt: row.created_at,
    };
  }

  async assign(schoolId, data) {
    const { classId, teacherId, isMain } = data;

    // If setting as main, unset any existing main teacher for this class
    if (isMain) {
      await sql`
        UPDATE class_teachers SET is_main = FALSE
        WHERE class_id = ${classId} AND school_id = ${schoolId}
      `;
      // Also update the legacy class_teacher_id on classes table
      await sql`
        UPDATE classes SET class_teacher_id = ${teacherId}
        WHERE class_id = ${classId} AND school_id = ${schoolId}
      `;
    }

    const rows = await sql`
      INSERT INTO class_teachers (school_id, class_id, teacher_id, is_main)
      VALUES (${schoolId}, ${classId}, ${teacherId}, ${isMain || false})
      ON CONFLICT (class_id, teacher_id) DO UPDATE SET
        is_main = COALESCE(${isMain || null}, class_teachers.is_main)
      RETURNING *
    `;

    return this.format(rows[0]);
  }

  async listByClass(schoolId, classId) {
    const rows = await sql`
      SELECT ct.*,
        c.name AS class_name,
        u.first_name AS teacher_first_name,
        u.last_name AS teacher_last_name,
        u.email AS teacher_email
      FROM class_teachers ct
      JOIN classes c ON ct.class_id = c.class_id
      JOIN users u ON ct.teacher_id = u.user_id
      WHERE ct.school_id = ${schoolId} AND ct.class_id = ${classId}
      ORDER BY ct.is_main DESC, u.last_name ASC
    `;
    return rows.map(r => this.format(r));
  }

  async listBySchool(schoolId) {
    const rows = await sql`
      SELECT ct.*,
        c.name AS class_name,
        u.first_name AS teacher_first_name,
        u.last_name AS teacher_last_name,
        u.email AS teacher_email
      FROM class_teachers ct
      JOIN classes c ON ct.class_id = c.class_id
      JOIN users u ON ct.teacher_id = u.user_id
      WHERE ct.school_id = ${schoolId}
      ORDER BY c.name ASC, u.last_name ASC
    `;
    return rows.map(r => this.format(r));
  }

  async remove(schoolId, classTeacherId) {
    // Get the assignment first to know which class/teacher
    const existing = await sql`
      SELECT * FROM class_teachers
      WHERE class_teacher_id = ${classTeacherId} AND school_id = ${schoolId}
    `;
    if (existing.length === 0) throw new Error('Assignment not found');

    // If this was the main teacher, unset class_teacher_id on classes table
    if (existing[0].is_main) {
      await sql`
        UPDATE classes SET class_teacher_id = NULL
        WHERE class_id = ${existing[0].class_id} AND school_id = ${schoolId}
      `;
    }

    await sql`
      DELETE FROM class_teachers
      WHERE class_teacher_id = ${classTeacherId} AND school_id = ${schoolId}
    `;
    return { deleted: true, classTeacherId };
  }

  /** Get all teachers (users with TEACHER role) for a school */
  async getAvailableTeachers(schoolId) {
    const rows = await sql`
      SELECT u.user_id, u.first_name, u.last_name, u.email,
        COALESCE(ct.class_count, 0) AS class_count
      FROM users u
      INNER JOIN user_roles ur ON u.user_id = ur.user_id
      INNER JOIN roles r ON ur.role_id = r.role_id
      LEFT JOIN (
        SELECT teacher_id, COUNT(*) AS class_count
        FROM class_teachers
        WHERE school_id = ${schoolId}
        GROUP BY teacher_id
      ) ct ON u.user_id = ct.teacher_id
      WHERE u.school_id = ${schoolId}
        AND u.is_active = true
        AND r.role_code = 'TEACHER'
      ORDER BY u.last_name ASC, u.first_name ASC
    `;

    // De-duplicate in case a user has multiple roles
    const seen = new Set();
    return rows.filter(r => {
      if (seen.has(r.user_id)) return false;
      seen.add(r.user_id);
      return true;
    }).map(r => ({
      id: r.user_id,
      firstName: r.first_name,
      lastName: r.last_name,
      email: r.email,
      classCount: r.class_count || 0,
    }));
  }
}

module.exports = new ClassTeacherService();
