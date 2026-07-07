const sql = require('../config/database');

class SubjectTeacherService {
  format(row) {
    return {
      id: row.subject_teacher_id,
      schoolId: row.school_id,
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      teacherId: row.teacher_id,
      teacherName: row.teacher_name,
      classId: row.class_id,
      className: row.class_name,
    };
  }

  async assign(schoolId, data) {
    const { subjectId, teacherId, classId } = data;
    const rows = await sql`
      INSERT INTO subject_teachers (school_id, subject_id, teacher_id, class_id)
      VALUES (${schoolId}, ${subjectId}, ${teacherId}, ${classId || null})
      ON CONFLICT (subject_id, teacher_id, class_id) DO NOTHING
      RETURNING *
    `;
    if (rows.length === 0) throw new Error('Assignment already exists');
    return this.format(rows[0]);
  }

  async listBySubject(schoolId, subjectId) {
    const rows = await sql`
      SELECT st.*, s.name AS subject_name,
        CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
        c.name AS class_name
      FROM subject_teachers st
      JOIN subjects s ON st.subject_id = s.subject_id
      JOIN users u ON st.teacher_id = u.user_id
      LEFT JOIN classes c ON st.class_id = c.class_id
      WHERE st.school_id = ${schoolId} AND st.subject_id = ${subjectId}
      ORDER BY teacher_name ASC
    `;
    return rows.map(r => this.format(r));
  }

  async listByTeacher(schoolId, teacherId) {
    const rows = await sql`
      SELECT st.*, s.name AS subject_name,
        CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
        c.name AS class_name
      FROM subject_teachers st
      JOIN subjects s ON st.subject_id = s.subject_id
      JOIN users u ON st.teacher_id = u.user_id
      LEFT JOIN classes c ON st.class_id = c.class_id
      WHERE st.school_id = ${schoolId} AND st.teacher_id = ${teacherId}
      ORDER BY s.name ASC
    `;
    return rows.map(r => this.format(r));
  }

  async listBySchool(schoolId, { limit = 50, offset = 0 } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT st.*, s.name AS subject_name,
        CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
        c.name AS class_name
      FROM subject_teachers st
      JOIN subjects s ON st.subject_id = s.subject_id
      JOIN users u ON st.teacher_id = u.user_id
      LEFT JOIN classes c ON st.class_id = c.class_id
      WHERE st.school_id = ${schoolId}
      ORDER BY s.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM subject_teachers WHERE school_id = ${schoolId}
    `;

    return {
      assignments: rows.map(r => this.format(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async remove(schoolId, subjectTeacherId) {
    const rows = await sql`
      DELETE FROM subject_teachers WHERE subject_teacher_id = ${subjectTeacherId} AND school_id = ${schoolId}
      RETURNING subject_teacher_id
    `;
    if (rows.length === 0) throw new Error('Assignment not found');
    return { deleted: true, subjectTeacherId };
  }
}

module.exports = new SubjectTeacherService();
