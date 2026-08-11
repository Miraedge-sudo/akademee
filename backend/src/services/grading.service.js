/**
 * Grading System Service
 *
 * Implements the Report Card Grading System specification (v1.2).
 * Handles CRUD for configuration entities, grade entry, and report-card
 * generation/calculation (averages, ranks, mentions, UE compensation).
 */

const sql = require('../config/database');
const AppError = require('../utils/AppError');
const { optimizeImageUrl } = require('../utils/imageUrl');

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

  /**
   * Generate an automatic per-subject remark from the subject average (out of
   * 20), following standard Cameroonian secondary-education wording. The
   * language follows the education system (ANG_* → English, otherwise French).
   * Returns null when there is no grade, so bulletins show « — » instead of a
   * fabricated remark. Teachers can still override it later.
   */
  generateSubjectRemark(average, eduSystemCode = null) {
    if (average == null) return null;
    const en = String(eduSystemCode || '').startsWith('ANG');
    const levels = [
      { min: 17, fr: 'Excellent', en: 'Excellent' },
      { min: 16, fr: 'Très bien', en: 'Very good' },
      { min: 14, fr: 'Bien', en: 'Good' },
      { min: 12, fr: 'Assez bien', en: 'Fairly good' },
      { min: 10, fr: 'Passable', en: 'Passable' },
      { min: 8, fr: 'Insuffisant', en: 'Insufficient' },
      { min: 0, fr: 'Faible', en: 'Weak' },
    ];
    const level = levels.find((l) => average >= l.min);
    return level ? (en ? level.en : level.fr) : null;
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
      sequenceId = null,
    } = data;

    if ((score == null || score === '') && status === 'GRADED') {
      throw new Error('Score is required when status is GRADED');
    }
    if (score != null && ['ABSENT_JUSTIFIED', 'ABSENT_UNJUSTIFIED', 'PENDING', 'EXEMPTED'].includes(status)) {
      throw new Error('Score cannot be provided when status is ' + status);
    }

    const rows = await sql`
      INSERT INTO grades (student_id, assessment_component_id, score, status, entered_by, entered_at, is_resit, sequence_id)
      VALUES (${studentId}, ${assessmentComponentId}, ${score || null}, ${status}, ${actorId || null}, now(), ${isResit}, ${sequenceId || null})
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
             so.class_level_id, so.period_structure_id,
             COALESCE(cs.coefficient, so.coefficient, 1) AS coefficient, so.credits
      FROM grades g
      JOIN assessment_components ac ON g.assessment_component_id = ac.assessment_component_id
      JOIN subject_offerings so ON ac.subject_offering_id = so.subject_offering_id
      LEFT JOIN class_subjects cs
        ON cs.class_id = so.class_level_id AND cs.subject_id = so.subject_id
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
    const { includeResit = false, sequenceId = null } = options;

    const components = await sql`
      SELECT ac.*, g.score, g.status, g.is_resit
      FROM assessment_components ac
      LEFT JOIN grades g ON g.assessment_component_id = ac.assessment_component_id
        AND g.student_id = ${studentId}
        AND (g.is_resit = ${includeResit} OR (${includeResit} = false AND g.is_resit IS NULL))
        ${sequenceId ? sql`AND g.sequence_id = ${sequenceId}` : sql``}
      WHERE ac.subject_offering_id = ${subjectOfferingId}
    `;

    if (components.length === 0) {
      return { average: null, reason: 'NO_COMPONENTS_CONFIGURED' };
    }

    const weightSum = components.reduce((sum, c) => {
      return c.status === 'GRADED' && c.score != null ? sum + Number(c.weight_percent) : sum;
    }, 0);

    if (weightSum === 0) {
      return { average: null, reason: 'NO_GRADES_ENTERED' };
    }

    let total = 0;
    let maxScore = 0;
    for (const c of components) {
      if (c.status === 'GRADED' && c.score != null) {
        const ratio = Number(c.score) / Number(c.max_score);
        total += ratio * Number(c.weight_percent);
        if (Number(c.max_score) > maxScore) maxScore = Number(c.max_score);
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
    const { gradingScaleVersion, classLevelId: providedClassLevelId, sequenceId = null } = options;

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

    // The class-level coefficient set in the Classes UI (class_subjects) is the
    // source of truth; it overrides the subject_offering's coefficient so report
    // cards always show what the school assigned for that class.
    const offerings = await sql`
      SELECT so.*,
             COALESCE(cs.coefficient, so.coefficient, 1) AS effective_coefficient,
             s.name AS subject_name, s.name_fr, s.name_en, s.code, s.category
      FROM subject_offerings so
      LEFT JOIN class_subjects cs
        ON cs.class_id = so.class_level_id AND cs.subject_id = so.subject_id
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
        const { average, reason } = await this.computeSubjectAverage(studentId, offering.subject_offering_id, { sequenceId });
        if (average != null) {
          weightedSum += average * Number(offering.effective_coefficient);
          coefficientSum += Number(offering.effective_coefficient);
        }
        subjectResults.push({
          subjectOfferingId: offering.subject_offering_id,
          subjectId: offering.subject_id,
          subjectName: offering.subject_name,
          nameFr: offering.name_fr,
          nameEn: offering.name_en,
          code: offering.code,
          category: offering.category,
          coefficient: Number(offering.effective_coefficient),
          credits: Number(offering.credits),
          average,
          reason,
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
  /**
   * Compute per-student averages + ranks for the WHOLE cohort in a handful of
   * queries (instead of N+1 per student). This is the heart of the Phase 2
   * performance fix: one query for students, one for offerings, one for
   * components, one for all grades.
   *
   * Returns:
   *  {
   *    studentsMap: { [studentId]: { average, rawAverage, coefficientSum, subjectResults } },
   *    ranks: { [studentId]: { classRank, partialClassRanking, subjectRanks } },
   *    classAverage, classSize, partialClassRanking, subjectStats,
   *  }
   */
  async computeCohortResults(classLevelId, periodStructureId, options = {}) {
    const { gradingScaleVersion = null, sequenceId = null } = options;

    // 1. Students in the class (1 query)
    const students = await sql`
      SELECT e.student_id
      FROM enrollments e
      WHERE e.class_id = ${classLevelId}
        AND (e.enrolled_to IS NULL OR e.enrolled_to >= CURRENT_DATE)
      ORDER BY e.student_id
    `;
    const studentIds = students.map((s) => s.student_id);

    // 2. Offerings for this class + period (1 query)
    // The class-level coefficient set in the Classes UI (class_subjects) is the
    // source of truth; it overrides the subject_offering's coefficient so report
    // cards always show what the school assigned for that class.
    const offerings = await sql`
      SELECT so.*,
             COALESCE(cs.coefficient, so.coefficient, 1) AS effective_coefficient,
             s.name AS subject_name, s.name_fr, s.name_en, s.code, s.category
      FROM subject_offerings so
      LEFT JOIN class_subjects cs
        ON cs.class_id = so.class_level_id AND cs.subject_id = so.subject_id
      JOIN subjects s ON so.subject_id = s.subject_id
      WHERE so.period_structure_id = ${periodStructureId}
        AND so.class_level_id = ${classLevelId}
    `;
    const offeringIds = offerings.map((o) => o.subject_offering_id);

    // 3. Assessment components for those offerings (1 query)
    const components = offeringIds.length > 0 ? await sql`
      SELECT * FROM assessment_components
      WHERE subject_offering_id = ANY(${offeringIds})
    ` : [];
    const componentIds = components.map((c) => c.assessment_component_id);

    // 4. All grades for these students + components (1 query)
    const grades = (studentIds.length > 0 && componentIds.length > 0) ? await sql`
      SELECT g.student_id, g.assessment_component_id, g.score, g.status, g.is_resit
      FROM grades g
      WHERE g.student_id = ANY(${studentIds})
        AND g.assessment_component_id = ANY(${componentIds})
        AND (g.is_resit = false OR g.is_resit IS NULL)
        ${sequenceId ? sql`AND g.sequence_id = ${sequenceId}` : sql``}
    ` : [];

    // ── Build lookup maps ──
    const compsByOffering = {};
    for (const c of components) {
      if (!compsByOffering[c.subject_offering_id]) compsByOffering[c.subject_offering_id] = [];
      compsByOffering[c.subject_offering_id].push(c);
    }
    // Note: a student may have SEVERAL grade rows for the SAME assessment component
    // (e.g. legacy grade.service.create reuses the component across sequences).
    // We must keep ALL of them and average the scores below — otherwise term
    // bulletins would silently use only the last score.
    const gradesByKey = new Map(); // `studentId:componentId` -> [grade, ...]
    for (const g of grades) {
      const key = `${g.student_id}:${g.assessment_component_id}`;
      if (!gradesByKey.has(key)) gradesByKey.set(key, []);
      gradesByKey.get(key).push(g);
    }

    // ── Per-student subject averages + general average (in-memory) ──
    const studentsMap = {};
    const classAverages = {};

    for (const st of students) {
      const sid = st.student_id;
      let weightedSum = 0;
      let coefficientSum = 0;
      const subjectResults = [];

      for (const offering of offerings) {
        const comps = compsByOffering[offering.subject_offering_id] || [];
        let average = null;
        let reason = null;

        if (comps.length === 0) {
          reason = 'NO_COMPONENTS_CONFIGURED';
        } else {
          let total = 0;
          let weightSum = 0;
          let maxScore = 0;
          for (const c of comps) {
            // Average ALL grade rows for this (student, component) — matches the
            // old per-student LEFT JOIN which produced one row per grade and
            // therefore averaged scores when several sequences existed.
            const all = gradesByKey.get(`${sid}:${c.assessment_component_id}`) || [];
            const graded = all.filter((g) => g.status === 'GRADED' && g.score != null);
            if (graded.length > 0) {
              const avgScore = graded.reduce((s, g) => s + Number(g.score), 0) / graded.length;
              const ratio = avgScore / Number(c.max_score);
              total += ratio * Number(c.weight_percent);
              weightSum += Number(c.weight_percent);
              maxScore = Math.max(maxScore, Number(c.max_score));
            }
          }
          if (weightSum === 0) {
            reason = 'NO_GRADES_ENTERED';
          } else {
            const weightedRatio = total / weightSum;
            average = maxScore ? weightedRatio * maxScore : null;
          }
        }

        if (average != null) {
          weightedSum += average * Number(offering.effective_coefficient);
          coefficientSum += Number(offering.effective_coefficient);
        }
        subjectResults.push({
          subjectOfferingId: offering.subject_offering_id,
          subjectId: offering.subject_id,
          subjectName: offering.subject_name,
          nameFr: offering.name_fr,
          nameEn: offering.name_en,
          code: offering.code,
          category: offering.category,
          coefficient: Number(offering.effective_coefficient),
          credits: Number(offering.credits),
          average,
          reason,
        });
      }

      const generalAverage = coefficientSum > 0 ? weightedSum / coefficientSum : null;
      const rounded = generalAverage != null && gradingScaleVersion
        ? this._round(generalAverage, gradingScaleVersion.rounding_rule, gradingScaleVersion.decimal_precision)
        : generalAverage;

      studentsMap[sid] = { average: rounded, rawAverage: generalAverage, coefficientSum, subjectResults };
      classAverages[sid] = rounded;
    }

    // ── Ranks (class + per subject) ──
    const rank = (values, studentId) => {
      const sorted = Object.entries(values)
        .filter(([, v]) => v != null)
        .sort((a, b) => b[1] - a[1]);
      const partial = sorted.length < Object.keys(values).length;
      const pos = sorted.findIndex(([id]) => id === studentId);
      return { rank: pos >= 0 ? pos + 1 : null, partial };
    };

    const subjectAverages = {};
    for (const offering of offerings) {
      subjectAverages[offering.subject_offering_id] = {};
      for (const st of students) {
        const sr = studentsMap[st.student_id].subjectResults.find((r) => r.subjectOfferingId === offering.subject_offering_id);
        subjectAverages[offering.subject_offering_id][st.student_id] = sr?.average ?? null;
      }
    }

    const ranks = {};
    for (const st of students) {
      const sid = st.student_id;
      const classRank = rank(classAverages, sid);
      const subjectRanks = {};
      for (const offering of offerings) {
        subjectRanks[offering.subject_offering_id] = rank(subjectAverages[offering.subject_offering_id], sid).rank;
      }
      ranks[sid] = {
        classRank: classRank.rank,
        partialClassRanking: classRank.partial,
        subjectRanks,
      };
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

    return {
      studentsMap,
      ranks,
      classAverage,
      classSize: students.length,
      partialClassRanking: Object.keys(classAverages).length < students.length,
      subjectStats,
    };
  }

  /**
   * Compute ranks for a cohort (kept for API compat — delegates to the batch method).
   */
  async computeCohortRanks(classLevelId, periodStructureId, options = {}) {
    const data = await this.computeCohortResults(classLevelId, periodStructureId, options);
    return {
      ranks: data.ranks,
      classAverage: data.classAverage,
      classSize: data.classSize,
      partialClassRanking: data.partialClassRanking,
      subjectStats: data.subjectStats,
    };
  }

  /**
   * Phase 2: Pre-compute EVERYTHING needed for a whole-class report card batch
   * in a handful of queries, so the worker only does the inserts per student.
   *
   * Returns { prepared, cohortData } where `prepared` holds the resolved
   * school/config/grading-scale/mention data and `cohortData` holds the full
   * per-student averages + ranks (see computeCohortResults).
   */
  async prepareBatch(classLevelId, periodStructureId, options = {}) {
    const { sequenceId = null } = options;

    // Class → school + education system (1 query)
    const classRows = await sql`
      SELECT school_id, education_system_id FROM classes WHERE class_id = ${classLevelId}
    `;
    if (classRows.length === 0) throw new Error('Class not found');
    const schoolId = classRows[0].school_id;
    const educationSystemId = classRows[0].education_system_id;

    // Resolve period (sequence → parent period) (1-2 queries)
    let actualPeriodStructureId = periodStructureId;
    let originalSequenceId = sequenceId || null;
    let granularity = 'SEQUENCE';
    let periodRow = await sql`SELECT * FROM periods WHERE period_id = ${periodStructureId}`;
    if (periodRow.length === 0) {
      const seqRow = await sql`SELECT period_id FROM sequences WHERE sequence_id = ${periodStructureId}`;
      if (seqRow.length > 0) {
        originalSequenceId = periodStructureId;
        actualPeriodStructureId = seqRow[0].period_id;
        periodRow = await sql`SELECT * FROM periods WHERE period_id = ${actualPeriodStructureId}`;
      }
    }
    if (periodRow.length === 0) throw new Error('Period not found');
    granularity = this._periodTypeToGranularity(periodRow[0].type || 'SEQUENCE');

    // Config + grading scale + mention thresholds (shared by the whole class)
    const config = await this.getReportCardConfig(schoolId, granularity)
      || await this._defaultReportCardConfig(schoolId, granularity);
    const gradingScale = await this.getActiveGradingScaleVersion(config.grading_scale_id || (await this._defaultGradingScaleId(schoolId)));
    const scaleId = gradingScale ? gradingScale.grading_scale_version_id : null;
    const mentionSet = educationSystemId
      ? await this.getActiveMentionThresholdSet(educationSystemId, config.grading_scale_id || (await this._defaultGradingScaleId(schoolId)))
      : null;
    const thresholdSetId = mentionSet ? mentionSet.threshold_set_id : null;
    const thresholds = thresholdSetId ? await this.listMentionThresholds(thresholdSetId) : [];

    // Whole-cohort averages + ranks (4 queries)
    const cohortData = await this.computeCohortResults(classLevelId, actualPeriodStructureId, {
      gradingScaleVersion: gradingScale,
      sequenceId: originalSequenceId || null,
    });

    return {
      prepared: {
        schoolId,
        classLevelId,
        educationSystemId,
        actualPeriodStructureId,
        originalSequenceId,
        granularity,
        config,
        gradingScale,
        scaleId,
        thresholdSetId,
        thresholds,
      },
      cohortData,
    };
  }

  // ------------------------------------------------------------------
  // Report Cards
  // ------------------------------------------------------------------

  async generateReportCard(studentId, periodStructureId, actorId, options = {}) {
    try {
      return await this._generateReportCardInternal(studentId, periodStructureId, actorId, options);
    } catch (err) {
      // Database errors → 500 (server error)
      if (err.code && String(err.code).length >= 4) {
        throw new AppError(err.message, 500, err.details);
      }
      // Already an AppError — re-throw as-is so the middleware uses the original message
      if (err instanceof AppError) {
        throw err;
      }
      // Other errors: wrap in AppError to preserve the message through the error middleware
      throw new AppError(err.message, err.statusCode || 400, err.details);
    }
  }

  async _generateReportCardInternal(studentId, periodStructureId, actorId, options = {}) {
    // ── Phase 2 perf: reuse a pre-computed cohort (worker) when available ──
    const prepared = options.prepared || null;
    const cohortData = options.cohortData || null;

    let schoolId;
    let classLevelId;
    let educationSystemId;
    if (prepared) {
      ({ schoolId, classLevelId, educationSystemId } = prepared);
    } else {
      const classRow = await sql`
        SELECT c.class_id, c.school_id, c.education_system_id
        FROM enrollments e
        JOIN classes c ON e.class_id = c.class_id
        WHERE e.student_id = ${studentId}
          AND (e.enrolled_to IS NULL OR e.enrolled_to >= CURRENT_DATE)
        LIMIT 1
      `;
      if (classRow.length === 0) throw new Error('Student is not actively enrolled in any class');
      ({ school_id: schoolId, class_id: classLevelId, education_system_id: educationSystemId } = classRow[0]);
    }

    // Resolve periodStructureId: it may be a sequence ID, so look up the parent period
    let actualPeriodStructureId;
    let originalSequenceId;
    let granularity;
    if (prepared) {
      ({ actualPeriodStructureId, originalSequenceId, granularity } = prepared);
    } else {
      let resolvedPeriodId = periodStructureId;
      originalSequenceId = null;
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
      actualPeriodStructureId = resolvedPeriodId;
      granularity = this._periodTypeToGranularity(periodRow[0].type || 'SEQUENCE');
      // Also honor an explicit sequenceId in options when a plain period was given
      if (!originalSequenceId && options.sequenceId) originalSequenceId = options.sequenceId;
    }

    let config;
    let gradingScale;
    let scaleId;
    let thresholdSetId;
    let thresholds;
    if (prepared) {
      ({ config, gradingScale, scaleId, thresholdSetId, thresholds } = prepared);
    } else {
      config = await this.getReportCardConfig(schoolId, granularity)
        || await this._defaultReportCardConfig(schoolId, granularity);

      gradingScale = await this.getActiveGradingScaleVersion(config.grading_scale_id || (await this._defaultGradingScaleId(schoolId)));
      scaleId = gradingScale ? gradingScale.grading_scale_version_id : null;

      const mentionSet = educationSystemId
        ? await this.getActiveMentionThresholdSet(educationSystemId, config.grading_scale_id || (await this._defaultGradingScaleId(schoolId)))
        : null;
      thresholdSetId = mentionSet ? mentionSet.threshold_set_id : null;
      thresholds = thresholdSetId ? await this.listMentionThresholds(thresholdSetId) : [];
    }

    // ── Averages + cohort ranks: single batch computation (kills the N+1) ──
    let periodResult;
    let cohortRanks;
    if (cohortData) {
      periodResult = cohortData.studentsMap[studentId] || { average: null, rawAverage: null, coefficientSum: 0, subjectResults: [] };
      cohortRanks = cohortData;
    } else {
      const cohort = await this.computeCohortResults(classLevelId, actualPeriodStructureId, {
        gradingScaleVersion: gradingScale,
        sequenceId: originalSequenceId || null,
      });
      periodResult = cohort.studentsMap[studentId] || { average: null, rawAverage: null, coefficientSum: 0, subjectResults: [] };
      cohortRanks = cohort;
    }

    const studentRank = cohortRanks.ranks[studentId];
    const generalAverage = periodResult.average;
    const mention = this.deriveMention(generalAverage, thresholds);

    const eduSystemCode = options.educationSystemCode || null;

    // Wrap delete + re-insert + lines in a transaction for atomicity
    const reportCard = await sql.begin(async (tx) => {
      // Delete existing report card for this combo to avoid duplicate key
      await tx`
        DELETE FROM report_card_lines
        WHERE report_card_id IN (
          SELECT report_card_id FROM report_cards
          WHERE student_id = ${studentId}
            AND period_structure_id = ${actualPeriodStructureId}
            AND sequence_id IS NOT DISTINCT FROM ${originalSequenceId}
        )
      `;
      await tx`
        DELETE FROM grading_audit_logs
        WHERE entity_type = 'ReportCard'
          AND entity_id IN (
            SELECT report_card_id FROM report_cards
            WHERE student_id = ${studentId}
              AND period_structure_id = ${actualPeriodStructureId}
              AND sequence_id IS NOT DISTINCT FROM ${originalSequenceId}
          )
      `;
      await tx`
        DELETE FROM report_cards
        WHERE student_id = ${studentId}
          AND period_structure_id = ${actualPeriodStructureId}
          AND sequence_id IS NOT DISTINCT FROM ${originalSequenceId}
      `;

      const [report] = await tx`
        INSERT INTO report_cards (
        student_id, period_structure_id, sequence_id, status, version, general_average,
        class_rank, partial_ranking, class_size, class_average,
        mention, grading_scale_version_id, threshold_set_id, report_card_config_id,
        education_system_code,
        computed_at
      ) VALUES (
        ${studentId}, ${actualPeriodStructureId}, ${originalSequenceId}, 'DRAFT', 1, ${generalAverage},
        ${studentRank?.classRank || null}, ${studentRank?.partialClassRanking || false},
        ${cohortRanks.classSize}, ${cohortRanks.classAverage},
        ${mention}, ${scaleId}, ${thresholdSetId}, ${config.report_card_config_id},
        ${eduSystemCode},
        now()
      )
      RETURNING *
    `;

      // Create ReportCardLine rows inside the transaction
      const subjectLines = [];
      for (const sub of periodResult.subjectResults) {
        const weightedPoints = sub.average != null ? sub.average * sub.coefficient : null;
        const offeringId = sub.subjectOfferingId;
        const rankKey = sub.subjectOfferingId || sub.subjectId;
        const line = await tx`
          INSERT INTO report_card_lines (
            report_card_id, subject_offering_id, subject_id, subject_average,
            coefficient, weighted_points, subject_rank, validation_reason,
            teacher_remark
          ) VALUES (
            ${report.report_card_id}, ${offeringId}, ${sub.subjectId}, ${sub.average},
            ${sub.coefficient}, ${weightedPoints}, ${studentRank?.subjectRanks[rankKey] || null}, ${null},
            ${this.generateSubjectRemark(sub.average, eduSystemCode)}
          )
          RETURNING *
        `;
        subjectLines.push(line[0]);
      }

      return {
        reportCard: report,
        lines: subjectLines,
      };
    });

    // Audit outside transaction (can't pass tx to _audit helper)
    await this._audit('CREATE', 'ReportCard', reportCard.reportCard.report_card_id, actorId, null, reportCard.reportCard);    return reportCard;
  }

  /**
   * Get the school a report card belongs to (via its student).
   * Used to scope PDF/payload access to the requester's school.
   */
  async getReportCardSchool(reportCardId) {
    const rows = await sql`
      SELECT s.school_id
      FROM report_cards rc
      JOIN students s ON rc.student_id = s.student_id
      WHERE rc.report_card_id = ${reportCardId}
    `;
    return rows[0]?.school_id || null;
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
             rc.education_system_code AS stored_education_system_code,
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
             COALESCE(es.code::text, 'FR_GEN') AS education_system_code,
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
          // Keep the original format (no f_auto) for html2canvas/PDF bulletins.
          logoUrl: optimizeImageUrl(s.logo_url, { width: 256, format: false }),
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
        subjectId: l.subject_id,
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
        // Sequence-level scores for trimester/annual report cards
        sequenceScores: [],
      };
    });

    // ── Compute per-sequence subject scores for period-level report cards ──
    // Uses direct grades query with sequence_id since offerings are linked to the parent period
    if (!report.sequence_id && report.period_structure_id) {
      try {
        const sequences = await sql`
          SELECT sequence_id, label FROM sequences
          WHERE period_id = ${report.period_structure_id}
          ORDER BY created_at
        `;

        for (const seq of sequences) {
          try {
            // Direct query: grades filtered by sequence_id (old system field still populated)
            const seqGrades = await sql`
              SELECT g.subject_id, s.name AS subject_name,
                     ROUND(AVG(g.score)::numeric, 2) AS avg_score
              FROM grades g
              JOIN subjects s ON g.subject_id = s.subject_id
              WHERE g.student_id = ${report.student_id}
                AND g.sequence_id = ${seq.sequence_id}
                AND g.score IS NOT NULL
              GROUP BY g.subject_id, s.name
            `;

            // Build a lookup by subjectId
            const seqLookup = {};
            for (const sg of seqGrades) {
              seqLookup[sg.subject_id] = Number(sg.avg_score);
            }

            for (const sub of subjects) {
              const seqScore = sub.subjectId ? seqLookup[sub.subjectId] : null;
              sub.sequenceScores.push({
                sequenceLabel: seq.label,
                score: seqScore ?? null,
              });
            }
          } catch (seqErr) {
            console.warn(`Could not compute scores for sequence ${seq.label}:`, seqErr.message);
            for (const sub of subjects) {
              sub.sequenceScores.push({ sequenceLabel: seq.label, score: null });
            }
          }
        }
      } catch (err) {
        console.warn('Could not fetch sequences for period-level scores:', err.message);
      }
    }

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

    // Use the stored education_system_code if available, otherwise fall back to the class-linked one
    const effectiveEduCode = report.stored_education_system_code || report.education_system_code || 'FR_GEN';

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
        education_system: effectiveEduCode,
        education_system_label: report.education_system_label,
        class_name: report.class_name,
      },
      education_system_config: this._getEducationSystemDisplayConfig(effectiveEduCode),
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
        education_system_code,
        computed_at
      ) VALUES (
        ${existing[0].student_id}, ${existing[0].period_structure_id}, ${existing[0].sequence_id || null}, 'DRAFT', ${newVersion},
        ${existing[0].general_average}, ${existing[0].class_rank}, ${existing[0].partial_ranking},
        ${existing[0].class_size}, ${existing[0].class_average}, ${existing[0].mention},
        ${existing[0].grading_scale_version_id}, ${existing[0].threshold_set_id},
        ${existing[0].report_card_config_id}, ${existing[0].education_system_code || null},
        now()
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

    await sql.begin(async (tx) => {
      // Delete associated lines first (CASCADE should handle this, but explicit is safer)
      await tx`DELETE FROM report_card_lines WHERE report_card_id = ${reportCardId}`;
      await tx`DELETE FROM report_cards WHERE report_card_id = ${reportCardId}`;

      // ── Clean up background generation jobs ──
      // Jobs store the report_card_ids they produced in their `results` JSONB
      // column. Drop the dead reference when a bulletin is deleted. If a job has
      // reached a terminal state AND all of its cards are gone, remove the job
      // entirely — no point keeping jobs for bulletins that no longer exist.
      // ── Clean up background generation jobs ──
      // Jobs store the report_card_ids they produced in their `results` JSONB
      // column. IMPORTANT: with the installed postgres.js, binding a JS string
      // to a jsonb column stores it as a jsonb *string* (not an array) — see
      // reportCardQueue.normalizeJob. So jsonb array operators (jsonb_array_elements,
      // @>) would fail or silently match nothing here; we filter in JS instead.
      // Narrow candidates with a cheap text search, then parse + filter in JS.
      const candidateJobs = await tx`
        SELECT job_id, status, results
        FROM report_card_jobs
        WHERE results::text LIKE ${`%${reportCardId}%`}
      `;

      // Lazy require: reportCardQueue requires this module, so importing
      // it at the top would create a circular dependency. (Node caches the
      // module, so requiring once here is cheap.)
      const { getQueue } = require('./reportCardQueue');

      for (const row of candidateJobs) {
        // Normalize: postgres.js returns the jsonb as a raw JSON string with
        // the current stored shape (or a JS array) — handle both defensively.
        let results;
        if (Array.isArray(row.results)) {
          results = row.results;
        } else if (typeof row.results === 'string') {
          try { results = JSON.parse(row.results); } catch { results = null; }
        } else {
          results = null;
        }
        if (!Array.isArray(results)) continue; // unparseable → leave the job alone

        const before = results.length;
        const newResults = results.filter((r) => r && r.reportCardId !== reportCardId);
        if (newResults.length === before) continue; // this job doesn't reference the card

        const allCardsDeleted = newResults.length === 0;
        const terminal = ['COMPLETED', 'FAILED', 'CANCELLED'].includes(row.status);

        if (allCardsDeleted && terminal) {
          // Every card this job produced has been deleted → purge the job
          // (DB row + the underlying BullMQ job to stop any pending retry).
          const [deleted] = await tx`
            DELETE FROM report_card_jobs WHERE job_id = ${row.job_id} RETURNING bull_job_id
          `;
          if (deleted?.bull_job_id) {
            try {
              const bullJob = await getQueue().getJob(deleted.bull_job_id);
              if (bullJob) await bullJob.remove();
            } catch (err) {
              console.warn(`[GradingService] Could not remove Bull job ${deleted.bull_job_id}:`, err.message);
            }
          }
        } else {
          // Job still has (or may still produce) other cards → just drop the
          // reference to the deleted one so the history stays accurate.
          // (Same binding pattern as reportCardQueue — keeps the stored shape.)
          await tx`
            UPDATE report_card_jobs
            SET results = ${JSON.stringify(newResults)}, updated_at = now()
            WHERE job_id = ${row.job_id}
          `;
        }
      }
    });

    await this._audit('DELETE', 'ReportCard', reportCardId, actorId, existing[0], null);
    return { deleted: true };
  }

  async listReportCards(filters = {}) {
    const { schoolId, studentId, classLevelId, periodStructureId, status, educationSystemCode } = filters;
    const rows = await sql`
      SELECT rc.*, CONCAT(u.first_name, ' ', u.last_name) AS student_name, p.name AS period_name,
             seq.label AS sequence_label,
             e.class_id, cl.name AS class_name,
             -- The education system chosen at generation time (stored on the
             -- report card) is authoritative; the class's CURRENT system is
             -- only a fallback for legacy rows. This keeps generated bulletins
             -- grouped under the system the admin selected.
             COALESCE(rc.education_system_code::text, es.code::text) AS education_system_code,
             COALESCE(es_rc.name_en, es_rc.name_fr, es.name_en, es.name_fr,
                      rc.education_system_code::text, es.code::text) AS education_system_label
      FROM report_cards rc
      JOIN students s ON rc.student_id = s.student_id
      JOIN users u ON s.user_id = u.user_id
      JOIN periods p ON rc.period_structure_id = p.period_id
      LEFT JOIN sequences seq ON rc.sequence_id = seq.sequence_id
      LEFT JOIN enrollments e ON e.student_id = rc.student_id AND (e.enrolled_to IS NULL OR e.enrolled_to >= CURRENT_DATE)
      LEFT JOIN classes cl ON e.class_id = cl.class_id
      LEFT JOIN education_systems es ON cl.education_system_id = es.education_system_id
      -- education_systems.code is an enum column (education_system_code_enum);
      -- cast both sides to text so the join always resolves.
      LEFT JOIN education_systems es_rc ON es_rc.code::text = rc.education_system_code::text
      WHERE TRUE
        ${schoolId ? sql`AND s.school_id = ${schoolId}` : sql``}
        ${studentId ? sql`AND rc.student_id = ${studentId}` : sql``}
        ${classLevelId ? sql`AND e.class_id = ${classLevelId}` : sql``}
        ${periodStructureId ? sql`AND rc.period_structure_id = ${periodStructureId}` : sql``}
        ${status ? sql`AND rc.status = ${status}` : sql``}
        ${educationSystemCode ? sql`AND COALESCE(rc.education_system_code::text, es.code::text) = ${educationSystemCode}` : sql``}
      ORDER BY COALESCE(rc.education_system_code::text, es.code::text), cl.name, student_name, rc.created_at DESC
    `;
    return rows;
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
