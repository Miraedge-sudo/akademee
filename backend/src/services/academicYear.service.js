const sql = require('../config/database');

class AcademicYearService {
  formatYear(row) {
    return {
      id: row.academic_year_id,
      schoolId: row.school_id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      isCurrent: row.is_current,
      createdAt: row.created_at,
      // Per-year stats used by the academic years page (YearCard).
      // Default to 0 when the row was fetched without the stats join
      // (e.g. single-year create/update flows).
      students: row.student_count ?? 0,
      teachers: row.teacher_count ?? 0,
      classes: row.class_count ?? 0,
    };
  }

  async create(schoolId, data) {
    const { year, startDate, endDate, name, academicSystem } = data;
    const yearName = name || year || `${new Date(startDate).getFullYear()}-${new Date(endDate).getFullYear()}`;

    const rows = await sql`
      INSERT INTO academic_years (school_id, name, start_date, end_date)
      VALUES (${schoolId}, ${yearName}, ${startDate || null}, ${endDate || null})
      RETURNING *
    `;

    if (academicSystem) {
      const systemValue = academicSystem === 'anglophone' ? 'TERM_SEQUENCE' : 'SEMESTER_CA_EXAM';
      await sql`
        UPDATE schools SET academic_system = ${systemValue} WHERE school_id = ${schoolId}
      `;
    }

    return this.formatYear(rows[0]);
  }

  async getById(schoolId, yearId) {
    const rows = await sql`
      SELECT ay.*,
        (SELECT COUNT(*)::int FROM enrollments e
          WHERE e.academic_year_id = ay.academic_year_id AND e.status = 'active'
        ) AS student_count,
        (SELECT COUNT(*)::int FROM classes c
          WHERE c.academic_year_id = ay.academic_year_id AND c.school_id = ay.school_id
        ) AS class_count,
        (SELECT COUNT(DISTINCT st.teacher_id)::int FROM subject_teachers st
          JOIN classes c ON c.class_id = st.class_id
          WHERE c.academic_year_id = ay.academic_year_id AND c.school_id = ay.school_id
        ) AS teacher_count
      FROM academic_years ay
      WHERE ay.academic_year_id = ${yearId} AND ay.school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Academic year not found');
    return this.formatYear(rows[0]);
  }

  async listBySchool(schoolId, { limit = 50, offset = 0 } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT ay.*,
        (SELECT COUNT(*)::int FROM enrollments e
          WHERE e.academic_year_id = ay.academic_year_id AND e.status = 'active'
        ) AS student_count,
        (SELECT COUNT(*)::int FROM classes c
          WHERE c.academic_year_id = ay.academic_year_id AND c.school_id = ay.school_id
        ) AS class_count,
        (SELECT COUNT(DISTINCT st.teacher_id)::int FROM subject_teachers st
          JOIN classes c ON c.class_id = st.class_id
          WHERE c.academic_year_id = ay.academic_year_id AND c.school_id = ay.school_id
        ) AS teacher_count
      FROM academic_years ay
      WHERE ay.school_id = ${schoolId}
      ORDER BY ay.start_date DESC NULLS LAST
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total FROM academic_years WHERE school_id = ${schoolId}
    `;

    return {
      years: rows.map(r => this.formatYear(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async update(schoolId, yearId, data) {
    await this.getById(schoolId, yearId);
    const { year, startDate, endDate, name } = data;
    const yearName = name || year || null;
    const rows = await sql`
      UPDATE academic_years SET
        name = COALESCE(${yearName || null}, name),
        start_date = COALESCE(${startDate || null}, start_date),
        end_date = COALESCE(${endDate || null}, end_date)
      WHERE academic_year_id = ${yearId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatYear(rows[0]);
  }

  async setActive(schoolId, yearId) {
    await this.getById(schoolId, yearId);
    await sql`
      UPDATE academic_years SET is_current = false WHERE school_id = ${schoolId}
    `;
    const rows = await sql`
      UPDATE academic_years SET is_current = true
      WHERE academic_year_id = ${yearId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatYear(rows[0]);
  }

  async delete(schoolId, yearId) {
    await this.getById(schoolId, yearId);
    await sql`DELETE FROM academic_years WHERE academic_year_id = ${yearId} AND school_id = ${schoolId}`;
    return { deleted: true, yearId };
  }
}

module.exports = new AcademicYearService();
