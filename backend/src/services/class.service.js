const sql = require('../config/database');

class ClassService {
  formatClass(row) {
    return {
      id: row.class_id,
      schoolId: row.school_id,
      name: row.name,
      classTeacherId: row.class_teacher_id,
      teacherName: row.teacher_name || row.teacher_first_name
        ? `${row.teacher_first_name || ''} ${row.teacher_last_name || ''}`.trim()
        : null,
      teacherFirstName: row.teacher_first_name,
      teacherLastName: row.teacher_last_name,
      teacherEmail: row.teacher_email,
      academicYearId: row.academic_year_id,
      academicYearName: row.academic_year_name,
      capacity: row.capacity,
      studentCount: row.student_count || 0,
    };
  }

  async create(schoolId, data) {
    const { name, classTeacherId, academicYearId, capacity } = data;
    const rows = await sql`
      INSERT INTO classes (school_id, name, class_teacher_id, academic_year_id, capacity)
      VALUES (${schoolId}, ${name}, ${classTeacherId || null}, ${academicYearId || null}, ${capacity || null})
      RETURNING *
    `;
    return this.formatClass(rows[0]);
  }

  async getById(schoolId, classId) {
    const rows = await sql`
      SELECT c.*,
        u.first_name AS teacher_first_name,
        u.last_name AS teacher_last_name,
        u.email AS teacher_email,
        ay.name AS academic_year_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.class_id AND e.status = 'active')::int AS student_count
      FROM classes c
      LEFT JOIN users u ON c.class_teacher_id = u.user_id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.academic_year_id
      WHERE c.class_id = ${classId} AND c.school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Class not found');
    return this.formatClass(rows[0]);
  }

  async listBySchool(schoolId, { limit = 50, offset = 0, academicYearId } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT c.*,
        u.first_name AS teacher_first_name,
        u.last_name AS teacher_last_name,
        ay.name AS academic_year_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.class_id AND e.status = 'active')::int AS student_count
      FROM classes c
      LEFT JOIN users u ON c.class_teacher_id = u.user_id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.academic_year_id
      WHERE c.school_id = ${schoolId}
        ${academicYearId ? sql`AND c.academic_year_id = ${academicYearId}` : sql``}
      ORDER BY c.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM classes WHERE school_id = ${schoolId}
        ${academicYearId ? sql`AND academic_year_id = ${academicYearId}` : sql``}
    `;

    return {
      classes: rows.map(r => this.formatClass(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async update(schoolId, classId, data) {
    await this.getById(schoolId, classId);
    const { name, classTeacherId, academicYearId, capacity } = data;
    const rows = await sql`
      UPDATE classes SET
        name = COALESCE(${name || null}, name),
        class_teacher_id = COALESCE(${classTeacherId || null}, class_teacher_id),
        academic_year_id = COALESCE(${academicYearId || null}, academic_year_id),
        capacity = COALESCE(${capacity ?? null}, capacity)
      WHERE class_id = ${classId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatClass(rows[0]);
  }

  async delete(schoolId, classId) {
    await this.getById(schoolId, classId);
    await sql`DELETE FROM classes WHERE class_id = ${classId} AND school_id = ${schoolId}`;
    return { deleted: true, classId };
  }
}

module.exports = new ClassService();
