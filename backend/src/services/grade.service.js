const sql = require('../config/database');

class GradeService {
  formatGrade(row) {
    return {
      id: row.grade_id,
      schoolId: row.school_id,
      studentId: row.student_id,
      subjectId: row.subject_id,
      subjectName: row.subject_name,
      periodId: row.period_id,
      periodName: row.period_name || null,
      sequenceId: row.sequence_id || null,
      sequenceName: row.sequence_name || null,
      score: Number(row.score),
      previousScore: row.previous_score != null ? Number(row.previous_score) : null,
      coefficient: row.coefficient || 1,
      comment: row.comment,
      createdAt: row.created_at,
      updatedAt: row.updated_at || null,
      modified: row.previous_score != null,
    };
  }

  async create(schoolId, data) {
    const { studentId, subjectId, periodId, sequenceId, score, comment } = data;
    const rows = await sql`
      INSERT INTO grades (school_id, student_id, subject_id, period_id, sequence_id, score, comment)
      VALUES (${schoolId}, ${studentId}, ${subjectId}, ${periodId || null}, ${sequenceId || null}, ${score}, ${comment || null})
      RETURNING *
    `;
    const created = this.formatGrade(rows[0]);
    // Fetch period name if periodId is provided
    if (rows[0].period_id) {
      const periodRows = await sql`SELECT name FROM periods WHERE period_id = ${rows[0].period_id}`;
      if (periodRows.length > 0) {
        created.periodName = periodRows[0].name;
      }
    }
    // Fetch sequence name if sequenceId is provided
    if (rows[0].sequence_id) {
      const seqRows = await sql`SELECT label FROM sequences WHERE sequence_id = ${rows[0].sequence_id}`;
      if (seqRows.length > 0) {
        created.sequenceName = seqRows[0].label;
      }
    }
    return created;
  }

  async getById(schoolId, gradeId) {
    const rows = await sql`
      SELECT g.*, s.name AS subject_name, p.name AS period_name, seq.label AS sequence_name
      FROM grades g
      LEFT JOIN subjects s ON g.subject_id = s.subject_id
      LEFT JOIN periods p ON g.period_id = p.period_id
      LEFT JOIN sequences seq ON g.sequence_id = seq.sequence_id
      WHERE g.grade_id = ${gradeId} AND g.school_id = ${schoolId}
    `;
    if (rows.length === 0) throw new Error('Grade not found');
    return this.formatGrade(rows[0]);
  }

  async listBySchool(schoolId, { limit = 50, offset = 0, studentId, subjectId, periodId, academicYearId } = {}) {
    limit = Math.min(Math.max(1, limit), 500);
    offset = Math.max(0, offset);

    const rows = await sql`
      SELECT g.*, s.name AS subject_name, p.name AS period_name, seq.label AS sequence_name
      FROM grades g
      LEFT JOIN subjects s ON g.subject_id = s.subject_id
      LEFT JOIN periods p ON g.period_id = p.period_id
      LEFT JOIN sequences seq ON g.sequence_id = seq.sequence_id
      ${academicYearId ? sql`AND p.academic_year_id = ${academicYearId}` : sql``}
      WHERE g.school_id = ${schoolId}
        ${studentId ? sql`AND g.student_id = ${studentId}` : sql``}
        ${subjectId ? sql`AND g.subject_id = ${subjectId}` : sql``}
        ${periodId ? sql`AND g.period_id = ${periodId}` : sql``}
      ORDER BY g.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countRows = await sql`
      SELECT COUNT(*)::int AS total
      FROM grades g
      LEFT JOIN periods p ON g.period_id = p.period_id
      ${academicYearId ? sql`AND p.academic_year_id = ${academicYearId}` : sql``}
      WHERE g.school_id = ${schoolId}
        ${studentId ? sql`AND g.student_id = ${studentId}` : sql``}
        ${subjectId ? sql`AND g.subject_id = ${subjectId}` : sql``}
        ${periodId ? sql`AND g.period_id = ${periodId}` : sql``}
    `;

    return {
      grades: rows.map(r => this.formatGrade(r)),
      total: countRows[0].total,
      limit,
      offset,
    };
  }

  async listByClass(schoolId, classId, { academicYearId } = {}) {
    const rows = await sql`
      SELECT g.*, s.name AS subject_name, p.name AS period_name, seq.label AS sequence_name,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name
      FROM grades g
      LEFT JOIN subjects s ON g.subject_id = s.subject_id
      LEFT JOIN periods p ON g.period_id = p.period_id
      LEFT JOIN sequences seq ON g.sequence_id = seq.sequence_id
      JOIN enrollments e ON g.student_id = e.student_id AND e.class_id = ${classId} AND e.status = 'active'
      LEFT JOIN students st ON g.student_id = st.student_id
      LEFT JOIN users u ON st.user_id = u.user_id
      ${academicYearId ? sql`AND p.academic_year_id = ${academicYearId}` : sql``}
      WHERE g.school_id = ${schoolId}
      ORDER BY g.created_at DESC
    `;
    return rows.map(r => this.formatGrade(r));
  }

  async listByStudent(schoolId, studentId, { academicYearId } = {}) {
    const rows = await sql`
      SELECT g.*, s.name AS subject_name, p.name AS period_name, seq.label AS sequence_name
      FROM grades g
      LEFT JOIN subjects s ON g.subject_id = s.subject_id
      LEFT JOIN periods p ON g.period_id = p.period_id
      LEFT JOIN sequences seq ON g.sequence_id = seq.sequence_id
      ${academicYearId ? sql`AND p.academic_year_id = ${academicYearId}` : sql``}
      WHERE g.school_id = ${schoolId} AND g.student_id = ${studentId}
      ORDER BY g.created_at DESC
    `;
    return rows.map(r => this.formatGrade(r));
  }

  async update(schoolId, gradeId, data) {
    const existing = await this.getById(schoolId, gradeId);
    const { score, comment } = data;

    // If the score is being changed, store the previous score
    const newScore = score ?? existing.score;
    const previousScore = newScore !== existing.score ? existing.score : null;

    const rows = await sql`
      UPDATE grades SET
        score = ${newScore},
        previous_score = ${previousScore},
        updated_at = NOW(),
        comment = COALESCE(${comment || null}, comment)
      WHERE grade_id = ${gradeId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return this.formatGrade(rows[0]);
  }

  async delete(schoolId, gradeId) {
    await this.getById(schoolId, gradeId);
    await sql`DELETE FROM grades WHERE grade_id = ${gradeId} AND school_id = ${schoolId}`;
    return { deleted: true, gradeId };
  }
}

module.exports = new GradeService();
