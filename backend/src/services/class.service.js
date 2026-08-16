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
      levelId: row.level_id,
      levelName: row.level_name,
      seriesId: row.series_id,
      seriesName: row.series_name,
      capacity: row.capacity,
      studentCount: row.student_count || 0,
      educationSystemId: row.education_system_id,
      educationSystemCode: row.education_system_code,
      educationSystemName: row.education_system_name,
    };
  }

  /**
   * Résout l'année scolaire à rattacher à une classe : celle explicitement
   * fournie, sinon l'année active (is_current, auto-dérivée des dates), sinon
   * la plus récente. Évite de créer des classes sans année (academic_year_id
   * NULL) qui disparaissent des filtres par année.
   */
  async resolveActiveYear(schoolId, academicYearId) {
    if (academicYearId) return academicYearId;
    const [row] = await sql`
      SELECT academic_year_id
      FROM academic_years
      WHERE school_id = ${schoolId}
      ORDER BY is_current DESC, start_date DESC NULLS LAST
      LIMIT 1
    `;
    return row?.academic_year_id || null;
  }

  async create(schoolId, data) {
    const { name, classTeacherId, academicYearId, capacity, levelId, seriesId, educationSystemId } = data;
    const yearId = await this.resolveActiveYear(schoolId, academicYearId);
    const rows = await sql`
      INSERT INTO classes (school_id, name, class_teacher_id, academic_year_id, capacity, level_id, series_id, education_system_id)
      VALUES (${schoolId}, ${name}, ${classTeacherId || null}, ${yearId}, ${capacity || null}, ${levelId || null}, ${seriesId || null}, ${educationSystemId || null})
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
        l.name AS level_name,
        s.name AS series_name,
        es.code AS education_system_code,
        es.name_en || ' / ' || es.name_fr AS education_system_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.class_id AND e.status = 'active')::int AS student_count
      FROM classes c
      LEFT JOIN users u ON c.class_teacher_id = u.user_id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.academic_year_id
      LEFT JOIN system_levels l ON c.level_id = l.level_id
      LEFT JOIN system_series s ON c.series_id = s.series_id
      LEFT JOIN education_systems es ON c.education_system_id = es.education_system_id
      WHERE c.class_id = ${classId} AND c.school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Class not found');
    return this.formatClass(rows[0]);
  }

  async listBySchool(schoolId, { limit = 50, offset = 0, academicYearId } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    // Les classes sans année (academic_year_id NULL — créées avant la
    // sélection automatique d'année) restent visibles dans TOUTES les années :
    // on les inclut quand un filtre année est actif au lieu de les masquer.
    const yearFilter = academicYearId
      ? sql`AND (c.academic_year_id = ${academicYearId} OR c.academic_year_id IS NULL)`
      : sql``;
    const yearCountFilter = academicYearId
      ? sql`AND (academic_year_id = ${academicYearId} OR academic_year_id IS NULL)`
      : sql``;

    const rows = await sql`
      SELECT c.*,
        u.first_name AS teacher_first_name,
        u.last_name AS teacher_last_name,
        ay.name AS academic_year_name,
        l.name AS level_name,
        s.name AS series_name,
        es.code AS education_system_code,
        es.name_en || ' / ' || es.name_fr AS education_system_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.class_id AND e.status = 'active')::int AS student_count
      FROM classes c
      LEFT JOIN users u ON c.class_teacher_id = u.user_id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.academic_year_id
      LEFT JOIN system_levels l ON c.level_id = l.level_id
      LEFT JOIN system_series s ON c.series_id = s.series_id
      LEFT JOIN education_systems es ON c.education_system_id = es.education_system_id
      WHERE c.school_id = ${schoolId}
        ${yearFilter}
      ORDER BY c.name ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM classes WHERE school_id = ${schoolId}
        ${yearCountFilter}
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
    const { name, classTeacherId, academicYearId, capacity, levelId, seriesId, educationSystemId } = data;
    const rows = await sql`
      UPDATE classes SET
        name = COALESCE(${name || null}, name),
        class_teacher_id = COALESCE(${classTeacherId || null}, class_teacher_id),
        academic_year_id = COALESCE(${academicYearId || null}, academic_year_id),
        capacity = COALESCE(${capacity ?? null}, capacity),
        level_id = COALESCE(${levelId || null}, level_id),
        series_id = COALESCE(${seriesId || null}, series_id),
        education_system_id = COALESCE(${educationSystemId || null}, education_system_id)
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

  /**
   * Get all classes assigned to a specific teacher — combines both
   * class_teacher (main teacher) and subject_teacher (subject taught) assignments.
   */
  async getTeacherClasses(schoolId, teacherId) {
    const rows = await sql`
      SELECT DISTINCT c.*,
        u.first_name AS teacher_first_name,
        u.last_name AS teacher_last_name,
        u.email AS teacher_email,
        ay.name AS academic_year_name,
        l.name AS level_name,
        s.name AS series_name,
        es.code AS education_system_code,
        es.name_en || ' / ' || es.name_fr AS education_system_name,
        (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.class_id AND e.status = 'active')::int AS student_count
      FROM classes c
      LEFT JOIN users u ON c.class_teacher_id = u.user_id
      LEFT JOIN academic_years ay ON c.academic_year_id = ay.academic_year_id
      LEFT JOIN system_levels l ON c.level_id = l.level_id
      LEFT JOIN system_series s ON c.series_id = s.series_id
      LEFT JOIN education_systems es ON c.education_system_id = es.education_system_id
      WHERE c.school_id = ${schoolId}
        AND (
          c.class_teacher_id = ${teacherId}
          OR
          c.class_id IN (SELECT class_id FROM class_teachers WHERE teacher_id = ${teacherId})
          OR
          c.class_id IN (SELECT class_id FROM subject_teachers WHERE teacher_id = ${teacherId})
        )
      ORDER BY c.name ASC
    `;

    return rows.map(r => this.formatClass(r));
  }
}

module.exports = new ClassService();
