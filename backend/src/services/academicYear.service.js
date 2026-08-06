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
      SELECT * FROM academic_years WHERE academic_year_id = ${yearId} AND school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Academic year not found');
    return this.formatYear(rows[0]);
  }

  async listBySchool(schoolId, { limit = 50, offset = 0 } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT * FROM academic_years WHERE school_id = ${schoolId} ORDER BY start_date DESC NULLS LAST
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

  async carryOver(schoolId, targetYearId, { sourceYearId } = {}) {
    await this.getById(schoolId, targetYearId);

    let sourceId = sourceYearId;
    if (sourceId) {
      await this.getById(schoolId, sourceId);
      if (sourceId === targetYearId) throw new Error('Source and target years must be different');
    } else {
      const { years } = await this.listBySchool(schoolId, { limit: 100 });
      const source = years.find((y) => y.id !== targetYearId);
      if (!source) throw new Error('No previous academic year to copy from');
      sourceId = source.id;
    }

    return sql.begin(async (tx) => {
      const classKey = (c) => `${c.name || ''}|${c.level_id || ''}|${c.series_id || ''}`;

      const sourceClasses = await tx`
        SELECT * FROM classes WHERE school_id = ${schoolId} AND academic_year_id = ${sourceId}
      `;
      const existingClasses = await tx`
        SELECT * FROM classes WHERE school_id = ${schoolId} AND academic_year_id = ${targetYearId}
      `;
      const existingClassKeys = new Set(existingClasses.map(classKey));

      const classIdMap = {};
      let classesCopied = 0;
      for (const c of sourceClasses) {
        const key = classKey(c);
        if (existingClassKeys.has(key)) {
          const match = existingClasses.find((e) => classKey(e) === key);
          classIdMap[c.class_id] = match.class_id;
          continue;
        }
        const inserted = await tx`
          INSERT INTO classes (school_id, name, class_teacher_id, academic_year_id, capacity, level_id, series_id, education_system_id)
          VALUES (${schoolId}, ${c.name}, ${c.class_teacher_id || null}, ${targetYearId}, ${c.capacity || null}, ${c.level_id || null}, ${c.series_id || null}, ${c.education_system_id || null})
          RETURNING class_id
        `;
        classIdMap[c.class_id] = inserted[0].class_id;
        classesCopied += 1;
      }

      const sourceEnrollments = await tx`
        SELECT * FROM enrollments WHERE school_id = ${schoolId} AND academic_year_id = ${sourceId} AND status = 'active'
      `;
      const existingEnrollments = await tx`
        SELECT student_id, class_id FROM enrollments WHERE school_id = ${schoolId} AND academic_year_id = ${targetYearId}
      `;
      const existingEnrollKeys = new Set(
        existingEnrollments.map((e) => `${e.student_id}|${e.class_id}`)
      );

      let enrollmentsCopied = 0;
      for (const e of sourceEnrollments) {
        const newClassId = classIdMap[e.class_id];
        if (!newClassId) continue;
        const key = `${e.student_id}|${newClassId}`;
        if (existingEnrollKeys.has(key)) continue;
        await tx`
          INSERT INTO enrollments (school_id, student_id, class_id, academic_year_id, status)
          VALUES (${schoolId}, ${e.student_id}, ${newClassId}, ${targetYearId}, 'active')
        `;
        existingEnrollKeys.add(key);
        enrollmentsCopied += 1;
      }

      const sourceFees = await tx`
        SELECT * FROM fees WHERE school_id = ${schoolId} AND academic_year_id = ${sourceId}
      `;
      const existingFees = await tx`
        SELECT name, amount FROM fees WHERE school_id = ${schoolId} AND academic_year_id = ${targetYearId}
      `;
      const existingFeeKeys = new Set(existingFees.map((f) => `${f.name || ''}|${f.amount}`));

      let feesCopied = 0;
      for (const f of sourceFees) {
        const key = `${f.name || ''}|${f.amount}`;
        if (existingFeeKeys.has(key)) continue;
        await tx`
          INSERT INTO fees (school_id, name, amount, academic_year_id, due_date, is_active)
          VALUES (${schoolId}, ${f.name}, ${f.amount}, ${targetYearId}, ${f.due_date || null}, ${f.is_active ?? true})
        `;
        existingFeeKeys.add(key);
        feesCopied += 1;
      }

      return {
        sourceYearId: sourceId,
        targetYearId,
        classesCopied,
        enrollmentsCopied,
        feesCopied,
      };
    });
  }
}

module.exports = new AcademicYearService();
