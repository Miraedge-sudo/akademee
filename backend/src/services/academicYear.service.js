const sql = require('../config/database');

/**
 * Périodes par défaut selon le système académique de l'école :
 *  - TERM_SEQUENCE (anglophone / général) → 3 terms × 2 séquences
 *  - SEMESTER_CA_EXAM (francophone / technique) → 3 trimestres × 2 séquences
 *  - sinon → 3 trimestres × 2 séquences (défaut)
 * L'admin peut ensuite tout modifier / ajouter / supprimer librement.
 */
function defaultPeriodPreset(system) {
  // NB: `type` doit rester dans les valeurs acceptées par le validateur
  // période (`term|semester|sequence|ca|exam`) — le libellé affiché, lui,
  // est en français / anglais selon le système.
  const isTerm = system === 'TERM_SEQUENCE';
  return {
    type: 'term',
    periods: isTerm
      ? [
          { name: 'First Term', sequences: ['Sequence 1', 'Sequence 2'] },
          { name: 'Second Term', sequences: ['Sequence 3', 'Sequence 4'] },
          { name: 'Third Term', sequences: ['Sequence 5', 'Sequence 6'] },
        ]
      : [
          { name: '1er Trimestre', sequences: ['Séquence 1', 'Séquence 2'] },
          { name: '2e Trimestre', sequences: ['Séquence 3', 'Séquence 4'] },
          { name: '3e Trimestre', sequences: ['Séquence 5', 'Séquence 6'] },
        ],
  };
}

function splitRange(start, end, parts) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const total = e - s;
  const out = [];
  for (let i = 0; i < parts; i++) {
    out.push({
      start: new Date(s + (total * i) / parts),
      end: new Date(s + (total * (i + 1)) / parts),
    });
  }
  return out;
}

/**
 * Créneaux hebdomadaires par défaut (emploi du temps) selon le système :
 *  - TERM_SEQUENCE (anglophone) → Period 1-7 + Break, Lun → Ven
 *  - sinon (francophone) → Période 1-6 + Récréation, Lun → Sam
 * Mêmes horaires que le design de référence. L'admin peut tout modifier.
 */
function defaultTimetableSlots(system) {
  const isTerm = system === 'TERM_SEQUENCE';
  const days = isTerm ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6];
  const slots = isTerm
    ? [
        { name: 'Period 1', start: '07:30', end: '08:25', isBreak: false },
        { name: 'Period 2', start: '08:25', end: '09:20', isBreak: false },
        { name: 'Period 3', start: '09:20', end: '10:15', isBreak: false },
        { name: 'Break', start: '10:15', end: '10:35', isBreak: true },
        { name: 'Period 4', start: '10:35', end: '11:30', isBreak: false },
        { name: 'Period 5', start: '11:30', end: '12:25', isBreak: false },
        { name: 'Period 6', start: '12:25', end: '13:20', isBreak: false },
        { name: 'Period 7', start: '13:50', end: '14:45', isBreak: false },
      ]
    : [
        { name: 'Période 1', start: '07:30', end: '08:25', isBreak: false },
        { name: 'Période 2', start: '08:25', end: '09:20', isBreak: false },
        { name: 'Période 3', start: '09:20', end: '10:15', isBreak: false },
        { name: 'Récréation', start: '10:15', end: '10:35', isBreak: true },
        { name: 'Période 4', start: '10:35', end: '11:30', isBreak: false },
        { name: 'Période 5', start: '11:30', end: '12:25', isBreak: false },
        { name: 'Période 6', start: '12:25', end: '13:20', isBreak: false },
      ];
  return { days, slots };
}

class AcademicYearService {
  /**
   * Auto-derive the “current” year from the dates: the year whose
   * [start_date, end_date] contains today is marked is_current = true,
   * all others false. This makes the year status automatic (the admin no
   * longer has to flip it manually). No-op when no year covers today or
   * when the flag is already correct. Returns the current year id or null.
   */
  async syncCurrentFromDates(schoolId) {
    const rows = await sql`
      SELECT academic_year_id, start_date, end_date, is_current
      FROM academic_years
      WHERE school_id = ${schoolId}
    `;
    if (rows.length === 0) return null;

    const today = new Date(new Date().toDateString());
    let best = null;
    for (const r of rows) {
      if (!r.start_date || !r.end_date) continue;
      const start = new Date(r.start_date);
      const end = new Date(r.end_date);
      if (start <= today && end >= today && (!best || start > best.start)) {
        best = { id: r.academic_year_id, start };
      }
    }
    if (!best) return null;

    const active = rows.filter((r) => r.is_current).map((r) => r.academic_year_id);
    if (active.length === 1 && active[0] === best.id) return best.id;

    await sql`UPDATE academic_years SET is_current = false WHERE school_id = ${schoolId}`;
    await sql`UPDATE academic_years SET is_current = true WHERE academic_year_id = ${best.id}`;
    return best.id;
  }

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
    const yearRow = rows[0];

    // L'année qui couvre aujourd'hui devient automatiquement l'année courante
    await this.syncCurrentFromDates(schoolId);

    if (academicSystem) {
      const systemValue = academicSystem === 'anglophone' ? 'TERM_SEQUENCE' : 'SEMESTER_CA_EXAM';
      await sql`
        UPDATE schools SET academic_system = ${systemValue} WHERE school_id = ${schoolId}
      `;
    }

    // ── Périodes & séquences par défaut (l'admin les modifie ensuite) ──
    await this.seedDefaultPeriods(schoolId, yearRow.academic_year_id);
    // ── Créneaux hebdomadaires par défaut (emploi du temps) ──
    await this.seedDefaultTimetablePeriods(schoolId, yearRow.academic_year_id);

    return this.formatYear(yearRow);
  }

  /**
   * Crée les créneaux hebdomadaires par défaut (timetable_periods) si aucun
   * n'existe pour l'année. Utilise les horaires types du design selon le
   * système de l'école (anglophone 7 périodes / francophone 6 périodes).
   */
  async seedDefaultTimetablePeriods(schoolId, yearId) {
    const existing = await sql`
      SELECT 1 FROM timetable_periods WHERE school_id = ${schoolId} AND academic_year_id = ${yearId} LIMIT 1
    `;
    if (existing.length > 0) return { periods: 0 };

    const [school] = await sql`
      SELECT academic_system FROM schools WHERE school_id = ${schoolId}
    `;
    const { days, slots } = defaultTimetableSlots(school?.academic_system);

    const values = [];
    const params = [];
    let idx = 1;
    for (const day of days) {
      slots.forEach((s, i) => {
        params.push(schoolId, yearId, s.name, day, s.start, s.end, s.isBreak, i + 1);
        values.push(`($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7})`);
        idx += 8;
      });
    }

    await sql`
      INSERT INTO timetable_periods (school_id, academic_year_id, name, day, start_time, end_time, is_break, sort_order)
      VALUES ${sql.unsafe(values.join(', '))}
    `.catch(() => {});
    return { periods: values.length };
  }

  /**
   * Crée les périodes par défaut de l'année (+ leurs séquences) si aucune
   * période n'existe encore. Silencieux si l'année est déjà dans le passé
   * (les périodes passées ne peuvent pas être créées).
   */
  async seedDefaultPeriods(schoolId, yearId) {
    const existing = await sql`
      SELECT 1 FROM periods WHERE school_id = ${schoolId} AND academic_year_id = ${yearId} LIMIT 1
    `;
    if (existing.length > 0) return { periods: 0, sequences: 0 };

    const [school] = await sql`
      SELECT academic_system FROM schools WHERE school_id = ${schoolId}
    `;
    const preset = defaultPeriodPreset(school?.academic_system);
    const [year] = await sql`
      SELECT start_date, end_date FROM academic_years WHERE academic_year_id = ${yearId}
    `;

    const hasDates = year?.start_date && year?.end_date;
    const blocks = hasDates
      ? splitRange(year.start_date, year.end_date, preset.periods.length)
      : preset.periods.map(() => ({ start: null, end: null }));

    let periods = 0;
    let sequences = 0;
    for (let i = 0; i < preset.periods.length; i++) {
      const p = preset.periods[i];
      const block = blocks[i];

      // N'écrase jamais : une période en date passée est ignorée proprement
      if (block.start && new Date(block.start) < new Date(new Date().toDateString())) continue;

      try {
        const inserted = await sql`
          INSERT INTO periods (school_id, academic_year_id, name, type, start_date, end_date, sort_order)
          VALUES (${schoolId}, ${yearId}, ${p.name}, ${preset.type}, ${block.start ? block.start.toISOString().slice(0, 10) : null}, ${block.end ? block.end.toISOString().slice(0, 10) : null}, ${i + 1})
          RETURNING period_id, start_date, end_date
        `;
        const periodRow = inserted[0];
        periods += 1;

        const seqBlocks = block.start
          ? splitRange(block.start, block.end || block.start, p.sequences.length)
          : p.sequences.map(() => ({ start: null, end: null }));

        for (let j = 0; j < p.sequences.length; j++) {
          const sb = seqBlocks[j];
          if (sb.start && new Date(sb.start) < new Date(new Date().toDateString())) continue;
          try {
            await sql`
              INSERT INTO sequences (school_id, period_id, label, date_debut, date_fin, sort_order)
              VALUES (${schoolId}, ${periodRow.period_id}, ${p.sequences[j]}, ${sb.start ? sb.start.toISOString().slice(0, 10) : null}, ${sb.end ? sb.end.toISOString().slice(0, 10) : null}, ${j + 1})
            `;
            sequences += 1;
          } catch {
            // séquence ignorée (ex: date passée) — pas bloquant
          }
        }
      } catch {
        // période ignorée (ex: date passée) — pas bloquant
      }
    }

    return { periods, sequences };
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

    // Statut automatique : re-synchronise is_current selon les dates (no-op si déjà bon)
    await this.syncCurrentFromDates(schoolId);

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
    // Les dates ont pu changer → re-dérive l'année courante automatiquement
    await this.syncCurrentFromDates(schoolId);
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
    // Si l'année supprimée était courante, une autre prend le relais
    await this.syncCurrentFromDates(schoolId);
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
