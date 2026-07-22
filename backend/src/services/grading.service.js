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

    for (const offering of offerings) {
      const { average, reason } = await this.computeSubjectAverage(studentId, offering.subject_offering_id);
      if (average != null) {
        weightedSum += average * Number(offering.coefficient);
        coefficientSum += Number(offering.coefficient);
      }
      subjectResults.push({
        subjectOfferingId: offering.subject_offering_id,
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
        if (!subjectAverages[sub.subjectOfferingId]) subjectAverages[sub.subjectOfferingId] = {};
        subjectAverages[sub.subjectOfferingId][s.student_id] = sub.average;
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

    return { ranks, classAverage, classSize: students.length, partialClassRanking: Object.keys(classAverages).length < students.length };
  }

  // ------------------------------------------------------------------
  // Report Cards
  // ------------------------------------------------------------------

  async generateReportCard(studentId, periodStructureId, actorId, options = {}) {
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

    const periodRow = await sql`SELECT * FROM periods WHERE period_id = ${periodStructureId}`;
    if (periodRow.length === 0) throw new Error('Period not found');
    const granularity = this._periodTypeToGranularity(periodRow[0].type || 'SEQUENCE');

    const config = await this.getReportCardConfig(schoolId, granularity)
      || await this._defaultReportCardConfig(schoolId, granularity);

    const gradingScale = await this.getActiveGradingScaleVersion(config.grading_scale_id || (await this._defaultGradingScaleId(schoolId)));
    const scaleId = gradingScale ? gradingScale.grading_scale_version_id : null;

    const mentionSet = educationSystemId
      ? await this.getActiveMentionThresholdSet(educationSystemId, config.grading_scale_id || (await this._defaultGradingScaleId(schoolId)))
      : null;
    const thresholdSetId = mentionSet ? mentionSet.threshold_set_id : null;
    const thresholds = thresholdSetId ? await this.listMentionThresholds(thresholdSetId) : [];

    const periodResult = await this.computePeriodAverage(studentId, periodStructureId, { gradingScaleVersion: gradingScale, classLevelId });
    const cohortRanks = await this.computeCohortRanks(classLevelId, periodStructureId, { gradingScaleVersion: gradingScale });

    const studentRank = cohortRanks.ranks[studentId];
    const generalAverage = periodResult.average;
    const mention = this.deriveMention(generalAverage, thresholds);

    const report = await sql`
      INSERT INTO report_cards (
        student_id, period_structure_id, status, general_average,
        class_rank, partial_ranking, class_size, class_average,
        mention, grading_scale_version_id, threshold_set_id, report_card_config_id,
        computed_at
      ) VALUES (
        ${studentId}, ${periodStructureId}, 'DRAFT', ${generalAverage},
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
      const line = await sql`
        INSERT INTO report_card_lines (
          report_card_id, subject_offering_id, subject_average,
          coefficient, weighted_points, subject_rank, validation_reason
        ) VALUES (
          ${report[0].report_card_id}, ${sub.subjectOfferingId}, ${sub.average},
          ${sub.coefficient}, ${weightedPoints}, ${studentRank?.subjectRanks[sub.subjectOfferingId] || null}, ${null}
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
    const reportRows = await sql`
      SELECT rc.*,
             s.student_id,
             CONCAT(u.first_name, ' ', u.last_name) AS student_name,
             c.class_id, c.name AS class_name,
             es.code AS education_system_code,
             p.period_id, p.type AS period_type, p.label_fr, p.label_en,
             gsv.pass_mark, gsv.rounding_rule, gsv.decimal_precision,
             rcc.field_toggles, rcc.language_mode, rcc.signature_blocks
      FROM report_cards rc
      JOIN students s ON rc.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      JOIN classes c ON (SELECT class_id FROM enrollments WHERE student_id = s.student_id AND (enrolled_to IS NULL OR enrolled_to >= CURRENT_DATE) LIMIT 1) = c.class_id
      LEFT JOIN education_systems es ON c.education_system_id = es.education_system_id
      JOIN periods p ON rc.period_structure_id = p.period_id
      LEFT JOIN grading_scale_versions gsv ON rc.grading_scale_version_id = gsv.grading_scale_version_id
      LEFT JOIN report_card_configs rcc ON rc.report_card_config_id = rcc.report_card_config_id
      WHERE rc.report_card_id = ${reportCardId}
    `;
    if (reportRows.length === 0) throw new Error('Report card not found');
    const report = reportRows[0];

    const lineRows = await sql`
      SELECT rcl.*, s.name AS subject_name, s.name_fr, s.name_en, s.code AS subject_code
      FROM report_card_lines rcl
      JOIN subject_offerings so ON rcl.subject_offering_id = so.subject_offering_id
      JOIN subjects s ON so.subject_id = s.subject_id
      WHERE rcl.report_card_id = ${reportCardId}
      ORDER BY s.name
    `;

    const lang = language || report.language_mode || 'EN';
    const label = (row, fr, en) => {
      if (lang === 'FR') return fr || en;
      if (lang === 'EN') return en || fr;
      return { fr: fr || en, en: en || fr };
    };

    const subjects = lineRows.map((l) => ({
      subjectCode: l.subject_code,
      name: label(l, l.name_fr, l.name_en),
      coefficient: Number(l.coefficient),
      score: l.subject_average != null ? Number(l.subject_average) : null,
      weightedPoints: l.weighted_points != null ? Number(l.weighted_points) : null,
      subjectRank: l.subject_rank,
      teacherRemark: l.teacher_remark,
      validationReason: l.validation_reason,
    }));

    const payload = {
      report_card_id: report.report_card_id,
      status: report.status,
      version: report.version,
      student: {
        id: report.student_id,
        full_name: report.student_name,
        class_id: report.class_id,
        class_name: report.class_name,
      },
      period: {
        id: report.period_id,
        type: report.period_type,
        label: label(report, report.label_fr, report.label_en),
      },
      class_level: {
        education_system: report.education_system_code,
      },
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
        student_id, period_structure_id, status, version, general_average,
        class_rank, partial_ranking, class_size, class_average,
        mention, grading_scale_version_id, threshold_set_id, report_card_config_id,
        computed_at
      ) VALUES (
        ${existing[0].student_id}, ${existing[0].period_structure_id}, 'DRAFT', ${newVersion},
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

  async listReportCards(filters = {}) {
    const { studentId, classLevelId, periodStructureId, status } = filters;
    const rows = await sql`
      SELECT rc.*, CONCAT(u.first_name, ' ', u.last_name) AS student_name, p.name AS period_name
      FROM report_cards rc
      JOIN students s ON rc.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      JOIN periods p ON rc.period_structure_id = p.period_id
      WHERE TRUE
        ${studentId ? sql`AND rc.student_id = ${studentId}` : sql``}
        ${periodStructureId ? sql`AND rc.period_structure_id = ${periodStructureId}` : sql``}
        ${status ? sql`AND rc.status = ${status}` : sql``}
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
