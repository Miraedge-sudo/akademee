const sql = require('../config/database');

class GradeService {
  /**
   * Assure qu'une subject_offering + assessment_component existent
   * pour un couple (subject_id, class_id, period_id).
   * Retourne l'assessment_component_id.
   *
   * C'est le pont entre l'ancien système (subject_id) et le nouveau
   * système (assessment_component_id). Une fois que toutes les notes
   * sont migrées, cette méthode pourra être simplifiée/supprimée.
   */
  async _ensureOfferingAndComponent(schoolId, studentId, subjectId, periodId) {
    // 1. Trouver la classe de l'élève
    let classId = null;
    if (periodId) {
      const enrollRows = await sql`
        SELECT class_id FROM enrollments
        WHERE student_id = ${studentId} AND school_id = ${schoolId}
          AND status = 'active'
        LIMIT 1
      `;
      if (enrollRows.length > 0) classId = enrollRows[0].class_id;
    }

    // 2. Trouver ou créer une subject_offering
    let offeringId = null;
    if (classId && periodId) {
      const existing = await sql`
        SELECT subject_offering_id FROM subject_offerings
        WHERE subject_id = ${subjectId}
          AND class_level_id = ${classId}
          AND period_structure_id = ${periodId}
        LIMIT 1
      `;
      if (existing.length > 0) {
        offeringId = existing[0].subject_offering_id;
      } else {
        const created = await sql`
          INSERT INTO subject_offerings (subject_id, class_level_id, period_structure_id, coefficient, credits, is_elective)
          VALUES (${subjectId}, ${classId}, ${periodId}, 1, 0, false)
          RETURNING subject_offering_id
        `;
        offeringId = created[0].subject_offering_id;
      }
    }

    if (!offeringId) return null;

    // 3. Trouver ou créer un assessment_component par défaut (type GENERIC)
    const compRows = await sql`
      SELECT assessment_component_id FROM assessment_components
      WHERE subject_offering_id = ${offeringId}
        AND type = 'GENERIC'
      LIMIT 1
    `;
    if (compRows.length > 0) {
      return compRows[0].assessment_component_id;
    }

    const newComp = await sql`
      INSERT INTO assessment_components (subject_offering_id, type, weight_percent, max_score)
      VALUES (${offeringId}, 'GENERIC', 100, 20)
      RETURNING assessment_component_id
    `;
    return newComp[0].assessment_component_id;
  }

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

  /**
   * Crée une note en utilisant LE NOUVEAU SYSTÈME
   * (assessment_component_id) si possible, avec fallback
   * automatique vers l'ancien système.
   *
   * Si subjectId est fourni sans assessmentComponentId,
   * on crée automatiquement les entités du nouveau système.
   */
  async create(schoolId, data) {
    const { studentId, subjectId, periodId, sequenceId, score, comment } = data;

    // ── Créer via le nouveau système (assessment_component_id) uniquement ──
    const assessmentComponentId = await this._ensureOfferingAndComponent(
      schoolId, studentId, subjectId, periodId
    );

    if (!assessmentComponentId) {
      throw new Error(
        'Impossible de créer la note : aucun assessment component disponible. ' +
        'Assurez-vous que l\'élève est inscrit dans une classe.'
      );
    }

    const rows = await sql`
      INSERT INTO grades (school_id, student_id, assessment_component_id, score, status, comment)
      VALUES (${schoolId}, ${studentId}, ${assessmentComponentId}, ${score}, 'GRADED', ${comment || null})
      RETURNING *
    `;
    const created = this.formatGrade({
      ...rows[0],
      subject_id: subjectId,
      period_id: periodId,
      sequence_id: sequenceId,
    });
    // Fetch names
    if (periodId) {
      const periodRows = await sql`SELECT name FROM periods WHERE period_id = ${periodId}`;
      if (periodRows.length > 0) created.periodName = periodRows[0].name;
    }
    if (sequenceId) {
      const seqRows = await sql`SELECT label FROM sequences WHERE sequence_id = ${sequenceId}`;
      if (seqRows.length > 0) created.sequenceName = seqRows[0].label;
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
