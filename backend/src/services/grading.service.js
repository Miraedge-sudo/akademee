/**
 * Grading System Service
 *
 * Implements the Report Card Grading System specification (v1.2).
 * Handles CRUD for configuration entities, grade entry, and report-card
 * generation/calculation (averages, ranks, mentions, UE compensation).
 */

const sql = require('../config/database');

class GradingService {
  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  _round(value, rule = 'round_half_up', precision = 2) {
    if (value == null) return null;
    const factor = Math.pow(10, precision);
    let scaled = value * factor;
    switch (rule) {
      case 'truncate':
        scaled = Math.trunc(scaled);
        break;
      case 'round_half_even':
        scaled = this._roundHalfEven(scaled);
        break;
      case 'round_half_up':
      default:
        scaled = Math.round(scaled);
    }
    return scaled / factor;
  }

  _roundHalfEven(n) {
    const floor = Math.floor(n);
    const ceil = Math.ceil(n);
    const diff = Math.abs(n - floor);
    if (diff < 0.5) return floor;
    if (diff > 0.5) return ceil;
    return floor % 2 === 0 ? floor : ceil;
  }

  _coalesceNumber(value, fallback = 0) {
    return value == null ? fallback : Number(value);
  }

  async _audit(action, entityType, entityId, actorId, before, after) {
    await sql`
      INSERT INTO grading_audit_logs (entity_type, entity_id, action, actor_id, before_value, after_value)
      VALUES (${entityType}, ${entityId}, ${action}, ${actorId || null}, ${before || null}, ${after || null})
    `;
  }

  // ------------------------------------------------------------------
  // Education Systems
  // ------------------------------------------------------------------

  async listEducationSystems() {
    return await sql`SELECT * FROM education_systems ORDER BY code`;
  }

  async getEducationSystem(id) {
    const rows = await sql`SELECT * FROM education_systems WHERE education_system_id = ${id}`;
    return rows[0] || null;
  }

  // ------------------------------------------------------------------
  // Grading Scales & Versions
  // ------------------------------------------------------------------

  async createGradingScale(schoolId, data) {
    const { name, minValue = 0, maxValue = 20 } = data;
    const rows = await sql`
      INSERT INTO grading_scales (school_id, name, min_value, max_value)
      VALUES (${schoolId}, ${name}, ${minValue}, ${maxValue})
      RETURNING *
    `;
    return rows[0];
  }

  async listGradingScales(schoolId) {
    return await sql`SELECT * FROM grading_scales WHERE school_id = ${schoolId} ORDER BY name`;
  }

  async createGradingScaleVersion(gradingScaleId, data) {
    const {
      passMark = 10,
      roundingRule = 'round_half_up',
      decimalPrecision = 2,
    } = data;

    const rows = await sql`
      INSERT INTO grading_scale_versions (grading_scale_id, pass_mark, rounding_rule, decimal_precision)
      VALUES (${gradingScaleId}, ${passMark}, ${roundingRule}, ${decimalPrecision})
      RETURNING *
    `;
    return rows[0];
  }

  async listGradingScaleVersions(gradingScaleId) {
    return await sql`
      SELECT * FROM grading_scale_versions
      WHERE grading_scale_id = ${gradingScaleId}
      ORDER BY effective_from DESC
    `;
  }

  async getActiveGradingScaleVersion(gradingScaleId, at = new Date()) {
    const rows = await sql`
      SELECT * FROM grading_scale_versions
      WHERE grading_scale_id = ${gradingScaleId}
        AND effective_from <= ${at}
        AND (effective_to IS NULL OR effective_to > ${at})
      ORDER BY effective_from DESC
      LIMIT 1
    `;
    return rows[0] || null;
  }

  // ------------------------------------------------------------------
  // Mention Thresholds
  // ------------------------------------------------------------------

  async createMentionThresholdSet(data) {
    const { educationSystemId, gradingScaleId } = data;
    const rows = await sql`
      INSERT INTO mention_threshold_sets (education_system_id, grading_scale_id)
      VALUES (${educationSystemId}, ${gradingScaleId})
      RETURNING *
    `;
    return rows[0];
  }

  async createMentionThreshold(thresholdSetId, data) {
    const { minValue, maxValue, mentionLabelFr, mentionLabelEn } = data;
    const rows = await sql`
      INSERT INTO mention_thresholds (threshold_set_id, min_value, max_value, mention_label_fr, mention_label_en)
      VALUES (${thresholdSetId}, ${minValue}, ${maxValue}, ${mentionLabelFr}, ${mentionLabelEn})
      RETURNING *
    `;
    return rows[0];
  }

  async getActiveMentionThresholdSet(educationSystemId, gradingScaleId, at = new Date()) {
    const rows = await sql`
      SELECT * FROM mention_threshold_sets
      WHERE education_system_id = ${educationSystemId}
        AND grading_scale_id = ${gradingScaleId}
        AND effective_from <= ${at}
        AND (effective_to IS NULL OR effective_to > ${at})
      ORDER BY effective_from DESC
      LIMIT 1
    `;
    return rows[0] || null;
  }

  async listMentionThresholds(thresholdSetId) {
    return await sql`
      SELECT * FROM mention_thresholds
      WHERE threshold_set_id = ${thresholdSetId}
      ORDER BY min_value DESC
    `;
  }

  deriveMention(average, thresholds) {
    if (average == null || !thresholds || thresholds.length === 0) return null;
    for (const t of thresholds) {
      const min = Number(t.min_value);
      const max = t.max_value != null ? Number(t.max_value) : Infinity;
      if (average >= min && average <= max) {
        return t.mention_label_en || t.mention_label_fr;
      }
    }
    return null;
  }

  // ------------------------------------------------------------------
  // Report Card Config
  // ------------------------------------------------------------------

  async getReportCardConfig(schoolId, appliesTo) {
    const rows = await sql`
      SELECT * FROM report_card_configs
      WHERE school_id = ${schoolId} AND applies_to = ${appliesTo}
      LIMIT 1
    `;
    return rows[0] || null;
  }

  async upsertReportCardConfig(schoolId, data) {
    const {
      appliesTo,
      languageMode = 'BILINGUAL',
      fieldToggles = {},
      gradingScaleId,
      signatureBlocks = [],
    } = data;

    const rows = await sql`
      INSERT INTO report_card_configs (school_id, applies_to, language_mode, field_toggles, grading_scale_id, signature_blocks)
      VALUES (${schoolId}, ${appliesTo}, ${languageMode}, ${JSON.stringify(fieldToggles)}, ${gradingScaleId || null}, ${JSON.stringify(signatureBlocks)})
      ON CONFLICT (school_id, applies_to) DO UPDATE SET
        language_mode = EXCLUDED.language_mode,
        field_toggles = EXCLUDED.field_toggles,
        grading_scale_id = EXCLUDED.grading_scale_id,
        signature_blocks = EXCLUDED.signature_blocks,
        updated_at = now()
      RETURNING *
    `;
    return rows[0];
  }

  // ------------------------------------------------------------------
  // UE Groups
  // ------------------------------------------------------------------

  async createUEGroup(data) {
    const { programId, periodStructureId, name, compensationMode = 'NONE', minGroupAverage = 10 } = data;
    const rows = await sql`
      INSERT INTO ue_groups (program_id, period_structure_id, name, compensation_mode, min_group_average)
      VALUES (${programId}, ${periodStructureId}, ${name}, ${compensationMode}, ${minGroupAverage})
      RETURNING *
    `;
    return rows[0];
  }

  async listUEGroups(programId, periodStructureId) {
    return await sql`
      SELECT * FROM ue_groups
      WHERE program_id = ${programId} AND period_structure_id = ${periodStructureId}
    `;
  }

  // ------------------------------------------------------------------
  // Subject Offerings & Assessment Components
  // ------------------------------------------------------------------

  async createSubjectOffering(data) {
    const {
      subjectId,
      classLevelId,
      periodStructureId,
      ueGroupId,
      coefficient = 1,
      credits = 0,
      isElective = false,
    } = data;

    const rows = await sql`
      INSERT INTO subject_offerings (subject_id, class_level_id, period_structure_id, ue_group_id, coefficient, credits, is_elective)
      VALUES (${subjectId}, ${classLevelId}, ${periodStructureId}, ${ueGroupId || null}, ${coefficient}, ${credits}, ${isElective})
      RETURNING *
    `;
    return rows[0];
  }

  async listSubjectOfferings(filters = {}) {
    const { classLevelId, periodStructureId, subjectId } = filters;
    const rows = await sql`
      SELECT so.*, s.name AS subject_name, s.name_fr, s.name_en, s.code
      FROM subject_offerings so
      JOIN subjects s ON so.subject_id = s.subject_id
      WHERE TRUE
        ${classLevelId ? sql`AND so.class_level_id = ${classLevelId}` : sql``}
        ${periodStructureId ? sql`AND so.period_structure_id = ${periodStructureId}` : sql``}
        ${subjectId ? sql`AND so.subject_id = ${subjectId}` : sql``}
      ORDER BY s.name
    `;
    return rows;
  }

  async createAssessmentComponent(data) {
    const { subjectOfferingId, type, weightPercent = 0, maxScore = 20 } = data;
    const rows = await sql`
      INSERT INTO assessment_components (subject_offering_id, type, weight_percent, max_score)
      VALUES (${subjectOfferingId}, ${type}, ${weightPercent}, ${maxScore})
      RETURNING *
    `;
    return rows[0];
  }

  async listAssessmentComponents(subjectOfferingId) {
    return await sql`
      SELECT * FROM assessment_components
      WHERE subject_offering_id = ${subjectOfferingId}
      ORDER BY type
    `;
  }

  // ------------------------------------------------------------------
  // Grade Entry (v1)
  // ------------------------------------------------------------------

  async createGrade(actorId, data) {
    const {
      studentId,
      assessmentComponentId,
      score,
      status = 'GRADED',
      isResit = false,
    } = data;

    if ((score == null || score === '') && status === 'GRADED') {
      throw new Error('Score is required when status is GRADED');
    }
    if (score != null && ['ABSENT_JUSTIFIED', 'ABSENT_UNJUSTIFIED', 'PENDING', 'EXEMPTED'].includes(status)) {
      throw new Error('Score cannot be provided when status is ' + status);
    }

    const rows = await sql`
      INSERT INTO grades (student_id, assessment_component_id, score, status, entered_by, entered_at, is_resit)
      VALUES (${studentId}, ${assessmentComponentId}, ${score || null}, ${status}, ${actorId || null}, now(), ${isResit})
      RETURNING *
    `;

    await this._audit('CREATE', 'Grade', rows[0].grade_id, actorId, null, rows[0]);
    return rows[0];
  }

  async updateGrade(gradeId, actorId, data) {
    const existing = await sql`SELECT * FROM grades WHERE grade_id = ${gradeId}`;
    if (existing.length === 0) throw new Error('Grade not found');

    const { score, status, isResit } = data;
    const rows = await sql`
      UPDATE grades SET
        score = COALESCE(${score !== undefined ? score : null}, score),
        status = COALESCE(${status || null}, status),
        is_resit = COALESCE(${isResit !== undefined ? isResit : null}, is_resit),
        previous_score = CASE WHEN score IS DISTINCT FROM ${score !== undefined ? score : existing[0].score} THEN score ELSE previous_score END,
        updated_at = now()
      WHERE grade_id = ${gradeId}
      RETURNING *
    `;

    await this._audit('UPDATE', 'Grade', gradeId, actorId, existing[0], rows[0]);
    return rows[0];
  }

  async listGrades(filters = {}) {
    const { studentId, assessmentComponentId, periodStructureId, classLevelId, status } = filters;

    const rows = await sql`
      SELECT g.*,
             s.name AS subject_name, s.code AS subject_code,
             ac.type AS component_type, ac.weight_percent, ac.max_score,
             so.class_level_id, so.period_structure_id, so.coefficient, so.credits
      FROM grades g
      JOIN assessment_components ac ON g.assessment_component_id = ac.assessment_component_id
      JOIN subject_offerings so ON ac.subject_offering_id = so.subject_offering_id
      JOIN subjects s ON so.subject_id = s.subject_id
      WHERE TRUE
        ${studentId ? sql`AND g.student_id = ${studentId}` : sql``}
        ${assessmentComponentId ? sql`AND g.assessment_component_id = ${assessmentComponentId}` : sql``}
        ${periodStructureId ? sql`AND so.period_structure_id = ${periodStructureId}` : sql``}
        ${classLevelId ? sql`AND so.class_level_id = ${classLevelId}` : sql``}
        ${status ? sql`AND g.status = ${status}` : sql``}
      ORDER BY g.entered_at DESC
    `;
    return rows;
  }

  // ------------------------------------------------------------------
  // Calculation Engine
  // ------------------------------------------------------------------

  /**
   * Compute the subject average for one student + subject offering.
   * Only GRADED components count; EXEMPTED are excluded.
   * Returns { average, maxScore } or { average: null, reason }.
   */
  async computeSubjectAverage(studentId, subjectOfferingId, options = {}) {
    const { includeResit = false } = options;

    const components = await sql`
      SELECT ac.*, g.score, g.status, g.is_resit
      FROM assessment_components ac
      LEFT JOIN grades g ON g.assessment_component_id = ac.assessment_component_id
        AND g.student_id = ${studentId}
        AND g.is_resit = ${includeResit}
      WHERE ac.subject_offering_id = ${subjectOfferingId}
    `;

    if (components.length === 0) {
      return { average: null, reason: 'NO_COMPONENTS_CONFIGURED' };
    }

    const weightSum = components.reduce((sum, c) => {
      return c.status === 'GRADED' ? sum + Number(c.weight_percent) : sum;
    }, 0);

    if (weightSum === 0) {
      return { average: null, reason: 'NO_GRADES_ENTERED' };
    }

    let total = 0;
    let maxScore = 0;
    for (const c of components) {
      if (c.status === 'GRADED') {
        const ratio = Number(c.score) / Number(c.max_score);
        total += ratio * Number(c.weight_percent);
        if (!maxScore) maxScore = Number(c.max_score);
      }
    }

    const weightedRatio = weightSum > 0 ? total / weightSum : 0;
    const average = maxScore ? weightedRatio * maxScore : null;
    return { average, maxScore, weightSum, components };
  }

  /**
   * Compute period average for one student and one period.
   */
  async computePeriodAverage(studentId, periodStructureId, options = {}) {
    const { gradingScaleVersion, classLevelId: providedClassLevelId } = options;

    let classLevelId = providedClassLevelId;
    if (!classLevelId) {
      const enrollment = await sql`
        SELECT class_id FROM enrollments
        WHERE student_id = ${studentId} AND (enrolled_to IS NULL OR enrolled_to >= CURRENT_DATE)
        LIMIT 1
      `;
      classLevelId = enrollment[0]?.class_id;
    }

    if (!classLevelId) {
      throw new Error('Student is not actively enrolled in any class');
    }

    const offerings = await sql`
      SELECT so.*, s.name AS subject_name, s.name_fr, s.name_en, s.code, s.category
      FROM subject_offerings so
      JOIN subjects s ON so.subject_id = s.subject_id
      WHERE so.period_structure_id = ${periodStructureId}
        AND so.class_level_id = ${classLevelId}
    `;

    let weightedSum = 0;
    let coefficientSum = 0;
    const subjectResults = [];

    if (offerings.length > 0) {
      // ── New grading system: subject_offerings + assessment_components ──
      for (const offering of offerings) {
        const { average, reason } = await this.computeSubjectAverage(studentId, offering.subject_offering_id);
        if (average != null) {
          weightedSum += average * Number(offering.coefficient);
          coefficientSum += Number(offering.coefficient);
        }
        subjectResults.push({
          subjectOfferingId: offering.subject_offering_id,
          subjectId: offering.subject_id,
          subjectName: offering.subject_name,
          nameFr: offering.name_fr,
          nameEn: offering.name_en,
          code: offering.code,
          category: offering.category,
          coefficient: Number(offering.coefficient),
          credits: Number(offering.credits),
          average,
          reason,
        });
      }
    } else {
      // ── Fallback: old grade system (grades table with subject_id + period_id) ──
      // Used when subject_offerings / assessment_components are not configured
      // IMPORTANT: Deduplicate by subject_id — use the average of all scores per subject
      const oldGrades = await sql`
        SELECT s.subject_id, s.name AS subject_name, s.name_fr, s.name_en, s.code, s.category,
               ROUND(AVG(g.score)::numeric, 2) AS avg_score
        FROM grades g
        JOIN subjects s ON g.subject_id = s.subject_id
        WHERE g.student_id = ${studentId}
          AND g.period_id = ${periodStructureId}
          AND g.score IS NOT NULL
        GROUP BY s.subject_id, s.name, s.name_fr, s.name_en, s.code, s.category
        ORDER BY s.name
      `;

      for (const g of oldGrades) {
        const average = Number(g.avg_score);
        const coeff = 1; // Default coefficient
        weightedSum += average * coeff;
        coefficientSum += coeff;
        subjectResults.push({
          subjectOfferingId: null,
          subjectId: g.subject_id,
          subjectName: g.subject_name,
          nameFr: g.name_fr,
          nameEn: g.name_en,
          code: g.code,
          category: g.category,
          coefficient: coeff,
          credits: 0,
          average,
          reason: null,
        });
      }
    }

    const generalAverage = coefficientSum > 0 ? weightedSum / coefficientSum : null;
    const rounded = generalAverage != null && gradingScaleVersion
      ? this._round(generalAverage, gradingScaleVersion.rounding_rule, gradingScaleVersion.decimal_precision)
      : generalAverage;

    return {
      average: rounded,
      rawAverage: generalAverage,
      coefficientSum,
      subjectResults,
    };
  }

  /**
   * Compute ranks (class + per subject) for a cohort in a single pass.
   */
  async computeCohortRanks(classLevelId, periodStructureId, options = {}) {
    const { gradingScaleVersion } = options;

    const students = await sql`
      SELECT e.student_id
      FROM enrollments e
      WHERE e.class_id = ${classLevelId}
        AND (e.enrolled_to IS NULL OR e.enrolled_to >= CURRENT_DATE)
      ORDER BY e.student_id
    `;

    const classAverages = {};
    const subjectAverages = {};

    for (const s of students) {
      const result = await this.computePeriodAverage(s.student_id, periodStructureId, { gradingScaleVersion });
      classAverages[s.student_id] = result.average;
      for (const sub of result.subjectResults) {
        const rankKey = sub.subjectOfferingId || sub.subjectId;
        if (!subjectAverages[rankKey]) subjectAverages[rankKey] = {};
        subjectAverages[rankKey][s.student_id] = sub.average;
      }
    }

    const rank = (values, studentId) => {
      const sorted = Object.entries(values)
        .filter(([, v]) => v != null)
        .sort((a, b) => b[1] - a[1]);
      const partial = sorted.length < Object.keys(values).length;
      const pos = sorted.findIndex(([id]) => id === studentId);
      return { rank: pos >= 0 ? pos + 1 : null, partial };
    };

    const ranks = {};
    for (const s of students) {
      const classRank = rank(classAverages, s.student_id);
      ranks[s.student_id] = {
        classRank: classRank.rank,
        partialClassRanking: classRank.partial,
        subjectRanks: {},
      };
      for (const offeringId of Object.keys(subjectAverages)) {
        const subjectRank = rank(subjectAverages[offeringId], s.student_id);
        ranks[s.student_id].subjectRanks[offeringId] = subjectRank.rank;
      }
    }

    const gradedAverages = Object.values(classAverages).filter((v) => v != null);
    const classAverage = gradedAverages.length > 0
      ? gradedAverages.reduce((a, b) => a + b, 0) / gradedAverages.length
      : null;

    // Compute per-subject stats (min, max, avg)
    const subjectStats = {};
    for (const [offeringId, scores] of Object.entries(subjectAverages)) {
      const values = Object.values(scores).filter(v => v != null);
      if (values.length > 0) {
        subjectStats[offeringId] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          count: values.length,
        };
      }
    }

    return { ranks, classAverage, classSize: students.length, partialClassRanking: Object.keys(classAverages).length < students.length, subjectStats };
  }

  // ------------------------------------------------------------------
  // Report Cards
  // ------------------------------------------------------------------

  async generateReportCard(studentId, periodStructureId, actorId, options = {}) {
    try {
      return await this._generateReportCardInternal(studentId, periodStructureId, actorId, options);
    } catch (err) {
      // Strip any database error code so the error middleware returns a proper message
      // instead of a generic 409 for all PostgreSQL errors
      const cleanError = new Error(err.message);
      // Database errors → 500 (server error); other errors keep original status
      if (err.code && String(err.code).length >= 4) {
        cleanError.statusCode = 500;
      } else {
        cleanError.statusCode = err.statusCode || 400;
      }
      if (err.details) cleanError.details = err.details;
      throw cleanError;
    }
  }

  async _generateReportCardInternal(studentId, periodStructureId, actorId, options = {}) {
    const classRow = await sql`
      SELECT c.class_id, c.school_id, c.education_system_id
      FROM enrollments e
      JOIN classes c ON e.class_id = c.class_id
      WHERE e.student_id = ${studentId}
        AND (e.enrolled_to IS NULL OR e.enrolled_to >= CURRENT_DATE)
      LIMIT 1
    `;
    if (classRow.length === 0) throw new Error('Student is not actively enrolled in any class');

    const { school_id: schoolId, class_id: classLevelId, education_system_id: educationSystemId } = classRow[0];

    // Resolve periodStructureId: it may be a sequence ID, so look up the parent period
    let resolvedPeriodId = periodStructureId;
    let originalSequenceId = null;
    let periodRow = await sql`SELECT * FROM periods WHERE period_id = ${periodStructureId}`;
    if (periodRow.length === 0) {
      // Not a period — check if it's a sequence
      const seqRow = await sql`SELECT period_id FROM sequences WHERE sequence_id = ${periodStructureId}`;
      if (seqRow.length > 0) {
        originalSequenceId = periodStructureId;
        resolvedPeriodId = seqRow[0].period_id;
        periodRow = await sql`SELECT * FROM periods WHERE period_id = ${resolvedPeriodId}`;
      }
    }
    if (periodRow.length === 0) throw new Error('Period not found');
    const granularity = this._periodTypeToGranularity(periodRow[0].type || 'SEQUENCE');

    // Use the resolved period ID throughout the rest of the method
    const actualPeriodStructureId = resolvedPeriodId;

    const config = await this.getReportCardConfig(schoolId, granularity)
      || await this._defaultReportCardConfig(schoolId, granularity);

    const gradingScale = await this.getActiveGradingScaleVersion(config.grading_scale_id || (await this._defaultGradingScaleId(schoolId)));
    const scaleId = gradingScale ? gradingScale.grading_scale_version_id : null;

    const mentionSet = educationSystemId
      ? await this.getActiveMentionThresholdSet(educationSystemId, config.grading_scale_id || (await this._defaultGradingScaleId(schoolId)))
      : null;
    const thresholdSetId = mentionSet ? mentionSet.threshold_set_id : null;
    const thresholds = thresholdSetId ? await this.listMentionThresholds(thresholdSetId) : [];

    const periodResult = await this.computePeriodAverage(studentId, actualPeriodStructureId, { gradingScaleVersion: gradingScale, classLevelId });
    const cohortRanks = await this.computeCohortRanks(classLevelId, actualPeriodStructureId, { gradingScaleVersion: gradingScale });

    const studentRank = cohortRanks.ranks[studentId];
    const generalAverage = periodResult.average;
    const mention = this.deriveMention(generalAverage, thresholds);

    const report = await sql`
      INSERT INTO report_cards (
        student_id, period_structure_id, sequence_id, status, general_average,
        class_rank, partial_ranking, class_size, class_average,
        mention, grading_scale_version_id, threshold_set_id, report_card_config_id,
        computed_at
      ) VALUES (
        ${studentId}, ${actualPeriodStructureId}, ${originalSequenceId}, 'DRAFT', ${generalAverage},
        ${studentRank?.classRank || null}, ${studentRank?.partialClassRanking || false},
        ${cohortRanks.classSize}, ${cohortRanks.classAverage},
        ${mention}, ${scaleId}, ${thresholdSetId}, ${config.report_card_config_id},
        now()
      )
      RETURNING *
    `;

    // Create ReportCardLine rows
    const subjectLines = [];
    for (const sub of periodResult.subjectResults) {
      const weightedPoints = sub.average != null ? sub.average * sub.coefficient : null;
      // Support fallback: use subject_id when subject_offering_id is null (old grade system)
      const offeringId = sub.subjectOfferingId;
      const rankKey = sub.subjectOfferingId || sub.subjectId;
      const line = await sql`
        INSERT INTO report_card_lines (
          report_card_id, subject_offering_id, subject_id, subject_average,
          coefficient, weighted_points, subject_rank, validation_reason
        ) VALUES (
          ${report[0].report_card_id}, ${offeringId}, ${sub.subjectId}, ${sub.average},
          ${sub.coefficient}, ${weightedPoints}, ${studentRank?.subjectRanks[rankKey] || null}, ${null}
        )
        RETURNING *
      `;
      subjectLines.push(line[0]);
    }

    await this._audit('CREATE', 'ReportCard', report[0].report_card_id, actorId, null, report[0]);

    return {
      reportCard: report[0],
      lines: subjectLines,
    };
  }

  async getReportCardPayload(reportCardId, language = 'EN') {
    try {
      return await this._getReportCardPayloadInternal(reportCardId, language);
    } catch (err) {
      // Strip DB error codes to prevent 409/400 from error middleware
      const cleanError = new Error(err.message);
      if (err.code && String(err.code).length >= 4) {
        cleanError.statusCode = 500;
      } else {
        cleanError.statusCode = err.statusCode || 400;
      }
      if (err.details) cleanError.details = err.details;
      throw cleanError;
    }
  }

  async _getReportCardPayloadInternal(reportCardId, language = 'EN') {
    const reportRows = await sql`
      SELECT rc.*,
             s.student_id,
             CONCAT(u.first_name, ' ', u.last_name) AS student_name,
             s.gender,
             s.date_of_birth,
             s.registration_number,
             u.nationality,
             u.phone AS student_phone,
             u.email AS student_email,
             c.class_id, c.name AS class_name,
             c.school_id,
             COALESCE(es.code, 'FR_GEN') AS education_system_code,
             COALESCE(es.name_en, es.name_fr, es.code::text, 'Francophone Général') AS education_system_label,
             p.period_id, p.type AS period_type, p.label_fr, p.label_en, p.start_date, p.end_date,
             rc.sequence_id,
             seq.label AS sequence_label,
             seq.status AS sequence_status,
             gsv.pass_mark, gsv.rounding_rule, gsv.decimal_precision,
             rcc.field_toggles, rcc.language_mode, rcc.signature_blocks
      FROM report_cards rc
      JOIN students s ON rc.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN classes c ON (SELECT class_id FROM enrollments WHERE student_id = s.student_id AND (enrolled_to IS NULL OR enrolled_to >= CURRENT_DATE) LIMIT 1) = c.class_id
      LEFT JOIN education_systems es ON c.education_system_id = es.education_system_id
      JOIN periods p ON rc.period_structure_id = p.period_id
      LEFT JOIN grading_scale_versions gsv ON rc.grading_scale_version_id = gsv.grading_scale_version_id
      LEFT JOIN report_card_configs rcc ON rc.report_card_config_id = rcc.report_card_config_id
      LEFT JOIN sequences seq ON rc.sequence_id = seq.sequence_id
      WHERE rc.report_card_id = ${reportCardId}
    `;
    if (reportRows.length === 0) throw new Error('Report card not found');
    const report = reportRows[0];

    // ── Fetch school info for the bulletin ──
    let schoolInfo = null;
    if (report.school_id) {
      const schoolRows = await sql`
        SELECT name, logo_url, address, city, region, phone, email, tagline, year_founded
        FROM schools WHERE school_id = ${report.school_id}
      `;
      if (schoolRows.length > 0) {
        const s = schoolRows[0];
        schoolInfo = {
          name: s.name,
          logoUrl: s.logo_url,
          address: s.address,
          city: s.city,
          region: s.region,
          phone: s.phone,
          email: s.email,
          tagline: s.tagline,
          yearFounded: s.year_founded,
        };
      }
    }

    const lineRows = await sql`
      SELECT rcl.*,
             COALESCE(s.name, subj.name) AS subject_name,
             COALESCE(s.name_fr, subj.name_fr) AS name_fr,
             COALESCE(s.name_en, subj.name_en) AS name_en,
             COALESCE(s.code, subj.code) AS subject_code
      FROM report_card_lines rcl
      LEFT JOIN subject_offerings so ON rcl.subject_offering_id = so.subject_offering_id
      LEFT JOIN subjects s ON so.subject_id = s.subject_id
      LEFT JOIN subjects subj ON rcl.subject_id = subj.subject_id
      WHERE rcl.report_card_id = ${reportCardId}
      ORDER BY COALESCE(s.name, subj.name)
    `;

    // ── Fetch individual assessment component scores (CA, Exam, Theory, Practical) ──
    const componentScoresMap = {};
    const offeringIds = lineRows
      .filter(l => l.subject_offering_id)
      .map(l => l.subject_offering_id);
    if (offeringIds.length > 0) {
      const compRows = await sql`
        SELECT ac.subject_offering_id, ac.type, ac.weight_percent, ac.max_score,
               g.score, g.status, g.grade_id
        FROM assessment_components ac
        LEFT JOIN grades g ON g.assessment_component_id = ac.assessment_component_id
          AND g.student_id = ${report.student_id}
          AND (g.is_resit = false OR g.is_resit IS NULL)
        WHERE ac.subject_offering_id = ANY(${offeringIds})
      `;
      for (const row of compRows) {
        if (!componentScoresMap[row.subject_offering_id]) {
          componentScoresMap[row.subject_offering_id] = {};
        }
        componentScoresMap[row.subject_offering_id][row.type] = {
          score: row.score != null ? Number(row.score) : null,
          maxScore: row.max_score != null ? Number(row.max_score) : null,
          weightPercent: row.weight_percent != null ? Number(row.weight_percent) : null,
          status: row.status,
        };
      }
    }

    const lang = report.language_mode || 'BILINGUAL';
    // label() returns the best available display name regardless of language_mode
    // This guarantees we NEVER return an object or null — always a string.
    const label = (row, fr, en) => {
      // If language is explicitly one or the other, prefer that.
      if (lang === 'FR') return fr || en || '';
      if (lang === 'EN') return en || fr || '';
      // Bilingual — pick whichever is available, preferring English.
      return en || fr || '';
    };

    // Compute per-subject min/max/avg from the cohort (same class + period)
    // Uses COALESCE to support fallback where subject_offering_id is null
    let rangeMap = {};
    try {
      const subjectRangeRows = await sql`
        SELECT COALESCE(rcl.subject_offering_id, rcl.subject_id) AS range_key,
               MIN(rcl.subject_average) AS min_score,
               MAX(rcl.subject_average) AS max_score,
               ROUND(AVG(rcl.subject_average)::numeric, 2) AS avg_score
        FROM report_card_lines rcl
        JOIN report_cards rc ON rcl.report_card_id = rc.report_card_id
        WHERE rc.period_structure_id = ${report.period_structure_id}
          AND rc.student_id IN (
            SELECT e.student_id FROM enrollments e
            WHERE e.class_id = ${report.class_id}
              AND (e.enrolled_to IS NULL OR e.enrolled_to >= CURRENT_DATE)
          )
        GROUP BY COALESCE(rcl.subject_offering_id, rcl.subject_id)
      `;
      for (const row of subjectRangeRows) {
        rangeMap[row.range_key] = {
          minScore: row.min_score != null ? Number(row.min_score) : null,
          maxScore: row.max_score != null ? Number(row.max_score) : null,
          avgScore: row.avg_score != null ? Number(row.avg_score) : null,
        };
      }
    } catch (err) {
      console.warn('Could not compute subject ranges:', err.message);
    }

    const subjects = lineRows.map((l) => {
      const range = rangeMap[l.subject_offering_id || l.subject_id] || {};
      const cs = componentScoresMap[l.subject_offering_id] || {};
      return {
        subjectCode: l.subject_code,
        name: label(l, l.name_fr, l.name_en),
        nameFr: l.name_fr,
        nameEn: l.name_en,
        coefficient: Number(l.coefficient),
        score: l.subject_average != null ? Number(l.subject_average) : null,
        weightedPoints: l.weighted_points != null ? Number(l.weighted_points) : null,
        subjectRank: l.subject_rank,
        minScore: range.minScore,
        maxScore: range.maxScore,
        classAvgScore: range.avgScore,
        teacherRemark: l.teacher_remark,
        validationReason: l.validation_reason,
        // Individual component scores
        caScore: cs['CONTINUOUS_ASSESSMENT']?.score ?? cs['CC']?.score ?? null,
        caMaxScore: cs['CONTINUOUS_ASSESSMENT']?.maxScore ?? cs['CC']?.maxScore ?? null,
        caWeightPercent: cs['CONTINUOUS_ASSESSMENT']?.weightPercent ?? cs['CC']?.weightPercent ?? null,
        examScore: cs['EXAM']?.score ?? null,
        examMaxScore: cs['EXAM']?.maxScore ?? null,
        examWeightPercent: cs['EXAM']?.weightPercent ?? null,
        theoryScore: cs['THEORY']?.score ?? null,
        theoryMaxScore: cs['THEORY']?.maxScore ?? null,
        theoryWeightPercent: cs['THEORY']?.weightPercent ?? null,
        practicalScore: cs['PRACTICAL']?.score ?? cs['TP']?.score ?? null,
        practicalMaxScore: cs['PRACTICAL']?.maxScore ?? cs['TP']?.maxScore ?? null,
        practicalWeightPercent: cs['PRACTICAL']?.weightPercent ?? cs['TP']?.weightPercent ?? null,
        componentStatus: Object.values(cs).length > 0 ? (Object.values(cs).some(c => c.status === 'GRADED') ? 'GRADED' : 'PENDING') : null,
      };
    });

    // ── Attendance stats for the student within the period's date range ──
    let attendance = null;
    if (report.student_id) {
      try {
        const periodStart = report.start_date;
        const periodEnd = report.end_date;
        const attRows = await sql`
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'present')::int AS present,
            COUNT(*) FILTER (WHERE status = 'absent')::int AS absent,
            COUNT(*) FILTER (WHERE status = 'late')::int AS late,
            COUNT(*) FILTER (WHERE status = 'excused')::int AS excused
          FROM attendance
          WHERE student_id = ${report.student_id}
            ${periodStart ? sql`AND date >= ${periodStart}` : sql``}
            ${periodEnd ? sql`AND date <= ${periodEnd}` : sql``}
        `;
        if (attRows.length > 0) {
          const a = attRows[0];
          attendance = {
            total: a.total,
            present: a.present,
            absent: a.absent,
            late: a.late,
            excused: a.excused,
            attendanceRate: a.total > 0
              ? Number((((a.present + a.late) / a.total) * 100).toFixed(1))
              : null,
          };
        }
      } catch (err) {
        console.warn('Could not fetch attendance stats:', err.message);
      }
    }

    const payload = {
      report_card_id: report.report_card_id,
      status: report.status,
      version: report.version,
      student: {
        id: report.student_id,
        full_name: report.student_name,
        gender: report.gender || null,
        date_of_birth: report.date_of_birth || null,
        registration_number: report.registration_number || null,
        class_id: report.class_id,
        class_name: report.class_name,
      },
      period: {
        id: report.period_id,
        type: report.period_type,
        label: label(report, report.label_fr, report.label_en),
        sequence_id: report.sequence_id || null,
        sequence_label: report.sequence_label || null,
        sequence_status: report.sequence_status || null,
      },
      class_level: {
        education_system: report.education_system_code,
        education_system_label: report.education_system_label,
        class_name: report.class_name,
      },
      education_system_config: this._getEducationSystemDisplayConfig(report.education_system_code),
      school_info: schoolInfo,
      subjects,
      summary: {
        general_average: report.general_average != null ? Number(report.general_average) : null,
        class_rank: report.class_rank ? `${report.class_rank}/${report.class_size}` : null,
        class_size: report.class_size,
        class_average: report.class_average != null ? Number(report.class_average) : null,
        partial_ranking: report.partial_ranking,
        mention: report.mention,
        pass_mark: report.pass_mark != null ? Number(report.pass_mark) : null,
      },
      attendance,
      config_applied: {
        language_mode: report.language_mode,
        field_toggles: report.field_toggles,
        signature_blocks: report.signature_blocks,
      },
    };

    // Cache payload on report card
    await sql`UPDATE report_cards SET payload = ${JSON.stringify(payload)} WHERE report_card_id = ${reportCardId}`;

    return payload;
  }

  async publishReportCard(reportCardId, actorId) {
    const existing = await sql`SELECT * FROM report_cards WHERE report_card_id = ${reportCardId}`;
    if (existing.length === 0) throw new Error('Report card not found');

    const rows = await sql`
      UPDATE report_cards
      SET status = 'PUBLISHED', published_at = now(), updated_at = now()
      WHERE report_card_id = ${reportCardId}
      RETURNING *
    `;

    await this._audit('PUBLISH', 'ReportCard', reportCardId, actorId, existing[0], rows[0]);
    return rows[0];
  }

  async reviseReportCard(reportCardId, actorId, reason) {
    const existing = await sql`SELECT * FROM report_cards WHERE report_card_id = ${reportCardId}`;
    if (existing.length === 0) throw new Error('Report card not found');

    await sql`
      UPDATE report_cards SET status = 'LOCKED', updated_at = now()
      WHERE report_card_id = ${reportCardId}
    `;

    const newVersion = existing[0].version + 1;
    const rows = await sql`
      INSERT INTO report_cards (
        student_id, period_structure_id, sequence_id, status, version, general_average,
        class_rank, partial_ranking, class_size, class_average,
        mention, grading_scale_version_id, threshold_set_id, report_card_config_id,
        computed_at
      ) VALUES (
        ${existing[0].student_id}, ${existing[0].period_structure_id}, ${existing[0].sequence_id || null}, 'DRAFT', ${newVersion},
        ${existing[0].general_average}, ${existing[0].class_rank}, ${existing[0].partial_ranking},
        ${existing[0].class_size}, ${existing[0].class_average}, ${existing[0].mention},
        ${existing[0].grading_scale_version_id}, ${existing[0].threshold_set_id},
        ${existing[0].report_card_config_id}, now()
      )
      RETURNING *
    `;

    await this._audit('REVISE', 'ReportCard', rows[0].report_card_id, actorId, existing[0], { ...rows[0], reason });
    return rows[0];
  }

  async lockReportCard(reportCardId, actorId) {
    const existing = await sql`SELECT * FROM report_cards WHERE report_card_id = ${reportCardId}`;
    if (existing.length === 0) throw new Error('Report card not found');

    const rows = await sql`
      UPDATE report_cards SET status = 'LOCKED', updated_at = now()
      WHERE report_card_id = ${reportCardId}
      RETURNING *
    `;
    await this._audit('LOCK', 'ReportCard', reportCardId, actorId, existing[0], rows[0]);
    return rows[0];
  }

  async unlockReportCard(reportCardId, actorId) {
    const existing = await sql`SELECT * FROM report_cards WHERE report_card_id = ${reportCardId}`;
    if (existing.length === 0) throw new Error('Report card not found');
    if (existing[0].status !== 'LOCKED') throw new Error('Only LOCKED report cards can be unlocked');

    const rows = await sql`
      UPDATE report_cards SET status = 'DRAFT', updated_at = now()
      WHERE report_card_id = ${reportCardId}
      RETURNING *
    `;
    await this._audit('UNLOCK', 'ReportCard', reportCardId, actorId, existing[0], rows[0]);
    return rows[0];
  }

  async deleteReportCard(reportCardId, actorId) {
    const existing = await sql`SELECT * FROM report_cards WHERE report_card_id = ${reportCardId}`;
    if (existing.length === 0) throw new Error('Report card not found');

    // Delete associated lines first (CASCADE should handle this, but explicit is safer)
    await sql`DELETE FROM report_card_lines WHERE report_card_id = ${reportCardId}`;
    await sql`DELETE FROM report_cards WHERE report_card_id = ${reportCardId}`;

    await this._audit('DELETE', 'ReportCard', reportCardId, actorId, existing[0], null);
    return { deleted: true };
  }

  async listReportCards(filters = {}) {
    const { studentId, classLevelId, periodStructureId, status, educationSystemCode } = filters;
    const rows = await sql`
      SELECT rc.*, CONCAT(u.first_name, ' ', u.last_name) AS student_name, p.name AS period_name
      FROM report_cards rc
      JOIN students s ON rc.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      JOIN periods p ON rc.period_structure_id = p.period_id
      ${classLevelId || educationSystemCode ? sql`JOIN enrollments e ON e.student_id = rc.student_id AND (e.enrolled_to IS NULL OR e.enrolled_to >= CURRENT_DATE)` : sql``}
      ${educationSystemCode ? sql`JOIN classes cl ON e.class_id = cl.class_id` : sql``}
      ${educationSystemCode ? sql`JOIN education_systems es ON cl.education_system_id = es.education_system_id` : sql``}
      WHERE TRUE
        ${studentId ? sql`AND rc.student_id = ${studentId}` : sql``}
        ${classLevelId ? sql`AND e.class_id = ${classLevelId}` : sql``}
        ${periodStructureId ? sql`AND rc.period_structure_id = ${periodStructureId}` : sql``}
        ${status ? sql`AND rc.status = ${status}` : sql``}
        ${educationSystemCode ? sql`AND es.code = ${educationSystemCode}` : sql``}
      ORDER BY rc.created_at DESC
    `;
    return rows;
  }

  async generateBatch(classLevelId, periodStructureId, actorId) {
    const students = await sql`
      SELECT e.student_id
      FROM enrollments e
      WHERE e.class_id = ${classLevelId}
        AND (e.enrolled_to IS NULL OR e.enrolled_to >= CURRENT_DATE)
      ORDER BY e.student_id
    `;

    const results = [];
    for (const s of students) {
      try {
        const generated = await this.generateReportCard(s.student_id, periodStructureId, actorId);
        results.push({ studentId: s.student_id, reportCardId: generated.reportCard.report_card_id, success: true });
      } catch (err) {
        results.push({ studentId: s.student_id, success: false, error: err.message });
      }
    }
    return results;
  }

  // ------------------------------------------------------------------
  // Education System Display Config — single source of truth for bulletin rendering
  // ------------------------------------------------------------------

  _getEducationSystemDisplayConfig(code) {
    const CONFIGS = {
      ANG_GEN: {
        code: 'ANG_GEN',
        name_fr: 'Anglophone Général',
        name_en: 'Anglophone General',
        lang: 'en',
        accent: '#1B4F72',
        is_university: false,
        ministry_fr: 'MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES — MINESEC',
        ministry_en: 'MINISTRY OF SECONDARY EDUCATION — MINESEC',
        period_labels: {
          SEQUENTIEL: { doc_fr: 'BULLETIN DE SÉQUENCE', doc_en: 'SEQUENTIAL REPORT CARD', unit_fr: 'Séquence', unit_en: 'Sequence', count: 6 },
          TRIMESTRIEL: { doc_fr: 'BULLETIN TRIMESTRIEL', doc_en: 'TERM REPORT CARD', unit_fr: 'Trimestre', unit_en: 'Term', count: 3 },
          ANNUEL: { doc_fr: 'BULLETIN ANNUEL', doc_en: 'ANNUAL REPORT CARD', unit_fr: 'Année Scolaire', unit_en: 'Academic Year', count: 1 },
        },
      },
      FR_GEN: {
        code: 'FR_GEN',
        name_fr: 'Francophone Général',
        name_en: 'Francophone General',
        lang: 'fr',
        accent: '#1B6B3C',
        is_university: false,
        ministry_fr: 'MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES — MINESEC',
        ministry_en: 'MINISTRY OF SECONDARY EDUCATION — MINESEC',
        period_labels: {
          SEQUENTIEL: { doc_fr: 'BULLETIN DE SÉQUENCE', doc_en: 'SEQUENTIAL REPORT CARD', unit_fr: 'Séquence', unit_en: 'Sequence', count: 6 },
          TRIMESTRIEL: { doc_fr: 'BULLETIN TRIMESTRIEL', doc_en: 'TERM REPORT CARD', unit_fr: 'Trimestre', unit_en: 'Term', count: 3 },
          ANNUEL: { doc_fr: 'BULLETIN ANNUEL', doc_en: 'ANNUAL REPORT CARD', unit_fr: 'Année Scolaire', unit_en: 'Academic Year', count: 1 },
        },
      },
      ANG_TECH: {
        code: 'ANG_TECH',
        name_fr: 'Anglophone Technique',
        name_en: 'Anglophone Technical',
        lang: 'en',
        accent: '#B5651D',
        is_university: false,
        ministry_fr: 'MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES — ENS. TECHNIQUE',
        ministry_en: 'MINISTRY OF SECONDARY EDUCATION — TECHNICAL & VOCATIONAL',
        period_labels: {
          SEQUENTIEL: { doc_fr: 'BULLETIN DE SÉQUENCE (TECHNIQUE)', doc_en: 'SEQUENTIAL REPORT CARD (TECHNICAL)', unit_fr: 'Séquence', unit_en: 'Sequence', count: 6 },
          TRIMESTRIEL: { doc_fr: 'BULLETIN TRIMESTRIEL (TECHNIQUE)', doc_en: 'TERM REPORT CARD (TECHNICAL)', unit_fr: 'Trimestre', unit_en: 'Term', count: 3 },
          ANNUEL: { doc_fr: 'BULLETIN ANNUEL (TECHNIQUE)', doc_en: 'ANNUAL REPORT CARD (TECHNICAL)', unit_fr: 'Année Scolaire', unit_en: 'Academic Year', count: 1 },
        },
      },
      FR_TECH: {
        code: 'FR_TECH',
        name_fr: 'Francophone Technique',
        name_en: 'Francophone Technical',
        lang: 'fr',
        accent: '#8B6914',
        is_university: false,
        ministry_fr: 'MINISTÈRE DES ENSEIGNEMENTS SECONDAIRES — ENS. TECHNIQUE',
        ministry_en: 'MINISTRY OF SECONDARY EDUCATION — TECHNICAL & VOCATIONAL',
        period_labels: {
          SEQUENTIEL: { doc_fr: 'BULLETIN DE SÉQUENCE (TECHNIQUE)', doc_en: 'SEQUENTIAL REPORT CARD (TECHNICAL)', unit_fr: 'Séquence', unit_en: 'Sequence', count: 6 },
          TRIMESTRIEL: { doc_fr: 'BULLETIN TRIMESTRIEL (TECHNIQUE)', doc_en: 'TERM REPORT CARD (TECHNICAL)', unit_fr: 'Trimestre', unit_en: 'Term', count: 3 },
          ANNUEL: { doc_fr: 'BULLETIN ANNUEL (TECHNIQUE)', doc_en: 'ANNUAL REPORT CARD (TECHNICAL)', unit_fr: 'Année Scolaire', unit_en: 'Academic Year', count: 1 },
        },
      },
      UNIV: {
        code: 'UNIV',
        name_fr: 'Université (LMD)',
        name_en: 'University (LMD)',
        lang: 'fr',
        accent: '#5B2C6F',
        is_university: true,
        ministry_fr: 'MINISTÈRE DE L\'ENSEIGNEMENT SUPÉRIEUR — MINESUP',
        ministry_en: 'MINISTRY OF HIGHER EDUCATION — MINESUP',
        period_labels: {
          SEQUENTIEL: { doc_fr: 'RELEVÉ DE CONTRÔLE CONTINU', doc_en: 'CONTINUOUS ASSESSMENT REPORT', unit_fr: 'Contrôle continu (mi-semestre)', unit_en: 'Mid-semester', count: 2 },
          TRIMESTRIEL: { doc_fr: 'RELEVÉ DE NOTES — SEMESTRE', doc_en: 'SEMESTER GRADE REPORT', unit_fr: 'Semestre', unit_en: 'Semester', count: 2 },
          ANNUEL: { doc_fr: 'BILAN ANNUEL LMD', doc_en: 'ANNUAL LMD REPORT', unit_fr: 'Année Universitaire', unit_en: 'Academic Year', count: 1 },
        },
      },
    };
    return CONFIGS[code] || CONFIGS.FR_GEN;
  }

  // ------------------------------------------------------------------
  // Defaults & utilities
  // ------------------------------------------------------------------

  _periodTypeToGranularity(type) {
    const map = {
      sequence: 'SEQUENCE',
      term: 'TERM',
      trimestre: 'TERM',
      semester: 'SEMESTER',
      academic_year: 'ANNUAL',
    };
    return map[(type || '').toLowerCase()] || 'SEQUENCE';
  }

  async _defaultGradingScaleId(schoolId) {
    const rows = await sql`
      SELECT grading_scale_id FROM grading_scales
      WHERE school_id = ${schoolId}
      ORDER BY created_at LIMIT 1
    `;
    return rows[0]?.grading_scale_id || null;
  }

  async _defaultReportCardConfig(schoolId, appliesTo) {
    const rows = await sql`
      INSERT INTO report_card_configs (school_id, applies_to, language_mode, field_toggles)
      VALUES (${schoolId}, ${appliesTo}, 'BILINGUAL', '{}')
      RETURNING *
    `;
    return rows[0];
  }
}

module.exports = new GradingService();
