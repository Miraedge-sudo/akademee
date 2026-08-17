/**
 * Timetable Service — Emploi du temps V1
 *
 * Modèle « grille par classe » (référence : docs/TIMETABLE_BENCHMARK.md) :
 *  - timetable_periods          : créneaux hebdomadaires (jour + horaires + pause)
 *  - timetable_entries          : un cours = matière + classe + enseignant + salle + créneau
 *  - timetable_unavailabilities : indisponibilités enseignant / classe / salle
 *  - rooms                      : salles de l'école
 *
 * Tout est scopé par école ET par année académique.
 * La détection de conflits est faite côté serveur (classe / enseignant / salle déjà
 * occupés sur le même créneau, indisponibilités) et renvoie une erreur 409 détaillée.
 * Les contraintes UNIQUE en base servent de garde-fou supplémentaire.
 */

const sql = require('../config/database');
const AppError = require('../utils/AppError');
const notificationService = require('./notification.service');

class TimetableService {
  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  /**
   * Résout l'année académique : celle fournie, sinon l'année active de l'école,
   * sinon la plus récente. Toute opération exige une année scolaire : on ne
   * renvoie null que si l'école n'a aucune année.
   */
  async _resolveYear(schoolId, academicYearId) {
    if (academicYearId) return academicYearId;
    const [active] = await sql`
      SELECT academic_year_id FROM academic_years
      WHERE school_id = ${schoolId} AND is_current = true
      LIMIT 1
    `;
    if (active?.academic_year_id) return active.academic_year_id;
    const [latest] = await sql`
      SELECT academic_year_id FROM academic_years
      WHERE school_id = ${schoolId}
      ORDER BY start_date DESC NULLS LAST, created_at DESC
      LIMIT 1
    `;
    return latest?.academic_year_id || null;
  }

  async _assertYear(schoolId, yearId) {
    const [y] = await sql`
      SELECT academic_year_id FROM academic_years
      WHERE academic_year_id = ${yearId} AND school_id = ${schoolId}
    `;
    if (!y) throw AppError.badRequest('Academic year not found in this school');
    return y;
  }

  async _assertClass(schoolId, classId, yearId = null) {
    const [c] = await sql`
      SELECT * FROM classes WHERE class_id = ${classId} AND school_id = ${schoolId}
    `;
    if (!c) throw AppError.badRequest('Class not found in this school');
    if (yearId && c.academic_year_id !== yearId) {
      throw AppError.badRequest('Class does not belong to the selected academic year');
    }
    return c;
  }

  async _assertSubject(schoolId, subjectId) {
    const [s] = await sql`
      SELECT * FROM subjects WHERE subject_id = ${subjectId} AND school_id = ${schoolId}
    `;
    if (!s) throw AppError.badRequest('Subject not found in this school');
    return s;
  }

  async _assertTeacher(schoolId, teacherId) {
    const [t] = await sql`
      SELECT u.user_id, u.first_name, u.last_name, u.is_active
      FROM users u
      JOIN user_roles ur ON ur.user_id = u.user_id
      JOIN roles r ON ur.role_id = r.role_id
      WHERE u.user_id = ${teacherId}
        AND u.school_id = ${schoolId}
        AND UPPER(r.role_code) = 'TEACHER'
      LIMIT 1
    `;
    if (!t) throw AppError.badRequest('Teacher not found in this school');
    return t;
  }

  async _assertRoom(schoolId, roomId) {
    const [r] = await sql`
      SELECT * FROM rooms WHERE room_id = ${roomId} AND school_id = ${schoolId}
    `;
    if (!r) throw AppError.badRequest('Room not found in this school');
    return r;
  }

  async _assertPeriod(schoolId, periodId, yearId = null) {
    const [p] = await sql`
      SELECT * FROM timetable_periods WHERE period_id = ${periodId} AND school_id = ${schoolId}
    `;
    if (!p) throw AppError.badRequest('Period not found in this school');
    if (yearId && p.academic_year_id !== yearId) {
      throw AppError.badRequest('Period does not belong to the selected academic year');
    }
    return p;
  }

  _toTime(v) {
    if (!v) return null;
    if (v instanceof Date) return v.toISOString().slice(11, 19);
    return String(v).slice(0, 8);
  }

  _formatPeriod(p) {
    return {
      id: p.period_id,
      name: p.name,
      day: p.day,
      startTime: this._toTime(p.start_time),
      endTime: this._toTime(p.end_time),
      isBreak: p.is_break,
      sortOrder: p.sort_order,
    };
  }

  _formatEntry(e) {
    return {
      id: e.entry_id,
      academicYearId: e.academic_year_id,
      classId: e.class_id,
      className: e.class_name || null,
      subjectId: e.subject_id,
      subjectName: e.subject_name || null,
      teacherId: e.teacher_id,
      teacherName: e.teacher_name || null,
      roomId: e.room_id,
      roomName: e.room_name || null,
      periodId: e.period_id,
      day: e.day,
      startTime: this._toTime(e.start_time),
      endTime: this._toTime(e.end_time),
    };
  }

  async _fetchEntry(schoolId, entryId) {
    const [e] = await sql`
      SELECT
        e.*,
        c.name AS class_name,
        s.name AS subject_name,
        CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
        r.name AS room_name,
        p.day,
        p.start_time,
        p.end_time
      FROM timetable_entries e
      JOIN classes c ON c.class_id = e.class_id
      JOIN subjects s ON s.subject_id = e.subject_id
      JOIN users u ON u.user_id = e.teacher_id
      LEFT JOIN rooms r ON r.room_id = e.room_id
      JOIN timetable_periods p ON p.period_id = e.period_id
      WHERE e.entry_id = ${entryId} AND e.school_id = ${schoolId}
    `;
    if (!e) throw AppError.notFound('Timetable entry not found');
    return this._formatEntry(e);
  }

  /**
   * Collecte tous les conflits pour un cours sur un créneau donné :
   *  - classe déjà occupée sur le créneau
   *  - enseignant déjà occupé sur le créneau
   *  - salle déjà occupée sur le créneau
   *  - indisponibilités enseignant / classe / salle
   *
   * `db` peut être `sql` ou une transaction (`sql.begin`) pour réutiliser la
   * même connexion. `excludeEntryId` exclut le cours en cours de modification.
   */
  async _collectEntryConflicts(db, schoolId, yearId, { classId, teacherId, roomId, periodId }, excludeEntryId = null) {
    const conflicts = [];
    const exclude = excludeEntryId ? db`AND e.entry_id <> ${excludeEntryId}` : db``;

    const [classBusy] = await db`
      SELECT e.entry_id, c.name AS class_name
      FROM timetable_entries e
      JOIN classes c ON c.class_id = e.class_id
      WHERE e.academic_year_id = ${yearId}
        AND e.class_id = ${classId}
        AND e.period_id = ${periodId}
        ${exclude}
      LIMIT 1
    `;
    if (classBusy) {
      conflicts.push({
        type: 'class_busy',
        entity: 'class',
        entityId: classId,
        periodId,
        message: `Class "${classBusy.class_name}" already has a lesson on this period`,
      });
    }

    const [teacherBusy] = await db`
      SELECT e.entry_id, CONCAT(u.first_name, ' ', u.last_name) AS teacher_name
      FROM timetable_entries e
      JOIN users u ON u.user_id = e.teacher_id
      WHERE e.academic_year_id = ${yearId}
        AND e.teacher_id = ${teacherId}
        AND e.period_id = ${periodId}
        ${exclude}
      LIMIT 1
    `;
    if (teacherBusy) {
      conflicts.push({
        type: 'teacher_busy',
        entity: 'teacher',
        entityId: teacherId,
        periodId,
        message: `Teacher "${teacherBusy.teacher_name}" is already teaching on this period`,
      });
    }

    if (roomId) {
      const [roomBusy] = await db`
        SELECT e.entry_id, r.name AS room_name
        FROM timetable_entries e
        JOIN rooms r ON r.room_id = e.room_id
        WHERE e.academic_year_id = ${yearId}
          AND e.room_id = ${roomId}
          AND e.period_id = ${periodId}
          ${exclude}
      LIMIT 1
      `;
      if (roomBusy) {
        conflicts.push({
          type: 'room_busy',
          entity: 'room',
          entityId: roomId,
          periodId,
          message: `Room "${roomBusy.room_name}" is already in use on this period`,
        });
      }
    }

    const unavail = await db`
      SELECT u.entity_type, u.entity_id
      FROM timetable_unavailabilities u
      WHERE u.academic_year_id = ${yearId}
        AND u.period_id = ${periodId}
        AND (
          (u.entity_type = 'teacher' AND u.entity_id = ${teacherId})
          OR (u.entity_type = 'class' AND u.entity_id = ${classId})
          OR (${roomId ? db`u.entity_type = 'room' AND u.entity_id = ${roomId}` : db`false`})
        )
    `;
    for (const u of unavail) {
      const label = u.entity_type === 'teacher' ? 'Teacher' : u.entity_type === 'class' ? 'Class' : 'Room';
      conflicts.push({
        type: `${u.entity_type}_unavailable`,
        entity: u.entity_type,
        entityId: u.entity_id,
        periodId,
        message: `${label} is unavailable on this period`,
      });
    }

    return conflicts;
  }

  _throwIfConflicts(conflicts) {
    if (conflicts.length > 0) {
      const message = conflicts.map((c) => c.message).join('; ');
      throw new AppError(message, 409, conflicts);
    }
  }

  // ------------------------------------------------------------------
  // Periods (créneaux)
  // ------------------------------------------------------------------

  async listPeriods(schoolId, { academicYearId } = {}) {
    const yearId = await this._resolveYear(schoolId, academicYearId);
    if (!yearId) return { academicYearId: null, periods: [] };

    const rows = await sql`
      SELECT * FROM timetable_periods
      WHERE school_id = ${schoolId} AND academic_year_id = ${yearId}
      ORDER BY day, sort_order
    `;
    return { academicYearId: yearId, periods: rows.map((r) => this._formatPeriod(r)) };
  }

  async createPeriod(schoolId, data) {
    const yearId = await this._resolveYear(schoolId, data.academicYearId);
    if (!yearId) throw AppError.badRequest('academicYearId is required (or set an active academic year)');
    await this._assertYear(schoolId, yearId);

    const { name, day, startTime, endTime, isBreak = false, sortOrder = 0 } = data;
    const [row] = await sql`
      INSERT INTO timetable_periods (school_id, academic_year_id, name, day, start_time, end_time, is_break, sort_order)
      VALUES (${schoolId}, ${yearId}, ${name}, ${day}, ${startTime}, ${endTime}, ${isBreak}, ${sortOrder})
      RETURNING *
    `;
    return this._formatPeriod(row);
  }

  async createPeriods(schoolId, data) {
    const yearId = await this._resolveYear(schoolId, data.academicYearId);
    if (!yearId) throw AppError.badRequest('academicYearId is required (or set an active academic year)');
    await this._assertYear(schoolId, yearId);

    const periods = Array.isArray(data.periods) ? data.periods : [];
    if (periods.length === 0) throw AppError.badRequest('Provide at least one period');

    const created = [];
    for (const p of periods) {
      const { name, day, startTime, endTime, isBreak = false, sortOrder = 0 } = p;
      if (!name || !day || !startTime || !endTime) {
        throw AppError.badRequest('Each period requires name, day, startTime and endTime');
      }
      const [row] = await sql`
        INSERT INTO timetable_periods (school_id, academic_year_id, name, day, start_time, end_time, is_break, sort_order)
        VALUES (${schoolId}, ${yearId}, ${name}, ${day}, ${startTime}, ${endTime}, ${isBreak}, ${sortOrder})
        ON CONFLICT (school_id, academic_year_id, day, sort_order) DO NOTHING
        RETURNING *
      `;
      if (row) created.push(this._formatPeriod(row));
      // doublon (même jour + même ordre) → ignoré proprement, pas bloquant
    }
    return { academicYearId: yearId, periods: created };
  }

  async updatePeriod(schoolId, periodId, data) {
    const existing = await this._assertPeriod(schoolId, periodId);
    const { name, day, startTime, endTime, isBreak, sortOrder } = data;

    const [row] = await sql`
      UPDATE timetable_periods SET
        name = COALESCE(${name ?? null}, name),
        day = COALESCE(${day ?? null}, day),
        start_time = COALESCE(${startTime ?? null}, start_time),
        end_time = COALESCE(${endTime ?? null}, end_time),
        is_break = COALESCE(${isBreak ?? null}, is_break),
        sort_order = COALESCE(${sortOrder ?? null}, sort_order)
      WHERE period_id = ${periodId} AND school_id = ${schoolId}
      RETURNING *
    `;
    if (!row) throw AppError.notFound('Period not found');
    return this._formatPeriod(row);
  }

  async deletePeriod(schoolId, periodId, { force = false } = {}) {
    const existing = await this._assertPeriod(schoolId, periodId);
    const [count] = await sql`
      SELECT COUNT(*)::int AS total FROM timetable_entries WHERE period_id = ${periodId}
    `;
    // Garde-fou : un créneau qui contient des cours ne se supprime pas par
    // accident — la suppression supprimerait aussi ces cours (cascade).
    if ((count?.total ?? 0) > 0 && !force) {
      throw new AppError(
        `This period still has ${count.total} lesson(s). Set force=true to delete it anyway.`,
        409
      );
    }
    await sql`
      DELETE FROM timetable_periods WHERE period_id = ${periodId} AND school_id = ${schoolId}
    `;
    return {
      id: periodId,
      removedEntries: count?.total ?? 0,
    };
  }

  // ------------------------------------------------------------------
  // Rooms (salles)
  // ------------------------------------------------------------------

  async listRooms(schoolId) {
    const rows = await sql`
      SELECT * FROM rooms WHERE school_id = ${schoolId} ORDER BY name
    `;
    return rows.map((r) => ({
      id: r.room_id,
      name: r.name,
      capacity: r.capacity,
      roomType: r.room_type,
    }));
  }

  async createRoom(schoolId, data) {
    const { name, capacity = 0, roomType = 'classroom' } = data;
    if (!name) throw AppError.badRequest('Room name is required');
    const [row] = await sql`
      INSERT INTO rooms (school_id, name, capacity, room_type)
      VALUES (${schoolId}, ${name}, ${capacity}, ${roomType})
      RETURNING *
    `;
    return {
      id: row.room_id,
      name: row.name,
      capacity: row.capacity,
      roomType: row.room_type,
    };
  }

  async updateRoom(schoolId, roomId, data) {
    const [existing] = await sql`
      SELECT * FROM rooms WHERE room_id = ${roomId} AND school_id = ${schoolId}
    `;
    if (!existing) throw AppError.notFound('Room not found');

    const { name, capacity, roomType } = data;
    const [row] = await sql`
      UPDATE rooms SET
        name = COALESCE(${name ?? null}, name),
        capacity = COALESCE(${capacity ?? null}, capacity),
        room_type = COALESCE(${roomType ?? null}, room_type)
      WHERE room_id = ${roomId} AND school_id = ${schoolId}
      RETURNING *
    `;
    return {
      id: row.room_id,
      name: row.name,
      capacity: row.capacity,
      roomType: row.room_type,
    };
  }

  async deleteRoom(schoolId, roomId) {
    const [existing] = await sql`
      SELECT * FROM rooms WHERE room_id = ${roomId} AND school_id = ${schoolId}
    `;
    if (!existing) throw AppError.notFound('Room not found');
    await sql`DELETE FROM rooms WHERE room_id = ${roomId} AND school_id = ${schoolId}`;
    return { id: roomId };
  }

  // ------------------------------------------------------------------
  // Entries (cours)
  // ------------------------------------------------------------------

  async listEntries(schoolId, { academicYearId, classId, teacherId, roomId } = {}) {
    const yearId = await this._resolveYear(schoolId, academicYearId);
    if (!yearId) return { academicYearId: null, entries: [] };

    const rows = await sql`
      SELECT
        e.*,
        c.name AS class_name,
        s.name AS subject_name,
        CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
        r.name AS room_name,
        p.day,
        p.start_time,
        p.end_time
      FROM timetable_entries e
      JOIN classes c ON c.class_id = e.class_id
      JOIN subjects s ON s.subject_id = e.subject_id
      JOIN users u ON u.user_id = e.teacher_id
      LEFT JOIN rooms r ON r.room_id = e.room_id
      JOIN timetable_periods p ON p.period_id = e.period_id
      WHERE e.school_id = ${schoolId}
        AND e.academic_year_id = ${yearId}
        ${classId ? sql`AND e.class_id = ${classId}` : sql``}
        ${teacherId ? sql`AND e.teacher_id = ${teacherId}` : sql``}
        ${roomId ? sql`AND e.room_id = ${roomId}` : sql``}
      ORDER BY p.day, p.sort_order
    `;
    return { academicYearId: yearId, entries: rows.map((r) => this._formatEntry(r)) };
  }

  async createEntry(schoolId, data, actorId) {
    const yearId = await this._resolveYear(schoolId, data.academicYearId);
    if (!yearId) throw AppError.badRequest('academicYearId is required (or set an active academic year)');
    await this._assertYear(schoolId, yearId);

    const { classId, subjectId, teacherId, roomId, periodId } = data;
    await this._assertClass(schoolId, classId, yearId);
    await this._assertSubject(schoolId, subjectId);
    await this._assertTeacher(schoolId, teacherId);
    if (roomId) await this._assertRoom(schoolId, roomId);
    await this._assertPeriod(schoolId, periodId, yearId);

    const conflicts = await this._collectEntryConflicts(sql, schoolId, yearId, {
      classId,
      teacherId,
      roomId: roomId || null,
      periodId,
    });
    this._throwIfConflicts(conflicts);

    const [row] = await sql`
      INSERT INTO timetable_entries (school_id, academic_year_id, class_id, subject_id, teacher_id, room_id, period_id, created_by)
      VALUES (${schoolId}, ${yearId}, ${classId}, ${subjectId}, ${teacherId}, ${roomId || null}, ${periodId}, ${actorId || null})
      RETURNING *
    `;

    return this._fetchEntry(schoolId, row.entry_id);
  }

  async updateEntry(schoolId, entryId, data) {
    const existing = await this._fetchEntry(schoolId, entryId);
    const yearId = existing.academicYearId;

    const classId = data.classId ?? existing.classId;
    const subjectId = data.subjectId ?? existing.subjectId;
    const teacherId = data.teacherId ?? existing.teacherId;
    const roomId = data.roomId !== undefined ? data.roomId || null : existing.roomId;
    const periodId = data.periodId ?? existing.periodId;

    await this._assertClass(schoolId, classId, yearId);
    await this._assertSubject(schoolId, subjectId);
    await this._assertTeacher(schoolId, teacherId);
    if (roomId) await this._assertRoom(schoolId, roomId);
    await this._assertPeriod(schoolId, periodId, yearId);

    const conflicts = await this._collectEntryConflicts(sql, schoolId, yearId, {
      classId,
      teacherId,
      roomId,
      periodId,
    }, entryId);
    this._throwIfConflicts(conflicts);

    await sql`
      UPDATE timetable_entries SET
        class_id = ${classId},
        subject_id = ${subjectId},
        teacher_id = ${teacherId},
        room_id = ${roomId},
        period_id = ${periodId},
        updated_at = now()
      WHERE entry_id = ${entryId} AND school_id = ${schoolId}
    `;

    return this._fetchEntry(schoolId, entryId);
  }

  async deleteEntry(schoolId, entryId) {
    const existing = await this._fetchEntry(schoolId, entryId);
    await sql`
      DELETE FROM timetable_entries WHERE entry_id = ${entryId} AND school_id = ${schoolId}
    `;
    return { id: entryId };
  }

  /**
   * Remplace la grille complète d'une classe (transaction) : suppression des
   * cours existants de la classe pour l'année, puis insertion des nouveaux.
   * Les conflits sont vérifiés contre les autres classes (enseignant / salle)
   * et au sein du lot (classe déjà occupée sur le créneau).
   */
  async replaceClassEntries(schoolId, { academicYearId, classId, entries, notify }, actorId) {
    const yearId = await this._resolveYear(schoolId, academicYearId);
    if (!yearId) throw AppError.badRequest('academicYearId is required (or set an active academic year)');
    await this._assertYear(schoolId, yearId);
    const klass = await this._assertClass(schoolId, classId, yearId);

    const list = Array.isArray(entries) ? entries : [];

    // Validation des références (échec rapide, hors transaction)
    for (const e of list) {
      const { subjectId, teacherId, roomId, periodId } = e;
      if (!subjectId || !teacherId || !periodId) {
        throw AppError.badRequest('Each entry requires subjectId, teacherId and periodId');
      }
      await this._assertSubject(schoolId, subjectId);
      await this._assertTeacher(schoolId, teacherId);
      if (roomId) await this._assertRoom(schoolId, roomId);
      await this._assertPeriod(schoolId, periodId, yearId);
    }

    const inserted = await sql.begin(async (tx) => {
      await tx`
        DELETE FROM timetable_entries
        WHERE school_id = ${schoolId} AND academic_year_id = ${yearId} AND class_id = ${classId}
      `;

      // Cours des AUTRES classes sur l'année (pour vérifier enseignant / salle)
      const others = await tx`
        SELECT e.teacher_id, e.room_id, e.period_id
        FROM timetable_entries e
        WHERE e.academic_year_id = ${yearId} AND e.class_id <> ${classId}
      `;
      const teacherPeriods = new Set(others.filter((o) => o.teacher_id).map((o) => `${o.teacher_id}:${o.period_id}`));
      const roomPeriods = new Set(others.filter((o) => o.room_id).map((o) => `${o.room_id}:${o.period_id}`));

      const classPeriods = new Set();
      const conflicts = [];
      const seenPeriods = new Set();

      for (const e of list) {
        const { subjectId, teacherId, roomId, periodId } = e;

        if (classPeriods.has(periodId)) {
          conflicts.push({
            type: 'class_busy',
            entity: 'class',
            entityId: classId,
            periodId,
            message: `Class already has two lessons on the same period`,
          });
        }
        classPeriods.add(periodId);

        if (teacherPeriods.has(`${teacherId}:${periodId}`)) {
          conflicts.push({
            type: 'teacher_busy',
            entity: 'teacher',
            entityId: teacherId,
            periodId,
            message: `Teacher is already teaching another class on this period`,
          });
        }
        if (roomId && roomPeriods.has(`${roomId}:${periodId}`)) {
          conflicts.push({
            type: 'room_busy',
            entity: 'room',
            entityId: roomId,
            periodId,
            message: `Room is already in use by another class on this period`,
          });
        }

        // Indisponibilités (dans le lot : on ne vérifie chaque créneau qu'une fois)
        if (!seenPeriods.has(periodId)) {
          seenPeriods.add(periodId);
          const unavail = await tx`
            SELECT u.entity_type FROM timetable_unavailabilities u
            WHERE u.academic_year_id = ${yearId}
              AND u.period_id = ${periodId}
              AND (
                (u.entity_type = 'teacher' AND u.entity_id = ${teacherId})
                OR (u.entity_type = 'class' AND u.entity_id = ${classId})
                OR (${roomId ? tx`u.entity_type = 'room' AND u.entity_id = ${roomId}` : tx`false`})
              )
          `;
          for (const u of unavail) {
            const label = u.entity_type === 'teacher' ? 'Teacher' : u.entity_type === 'class' ? 'Class' : 'Room';
            conflicts.push({
              type: `${u.entity_type}_unavailable`,
              entity: u.entity_type,
              entityId: classId,
              periodId,
              message: `${label} is unavailable on this period`,
            });
          }
        }
      }

      if (conflicts.length > 0) {
        throw new AppError(conflicts.map((c) => c.message).join('; '), 409, conflicts);
      }

      const rows = [];
      for (const e of list) {
        const { subjectId, teacherId, roomId, periodId } = e;
        const [row] = await tx`
          INSERT INTO timetable_entries (school_id, academic_year_id, class_id, subject_id, teacher_id, room_id, period_id, created_by)
          VALUES (${schoolId}, ${yearId}, ${classId}, ${subjectId}, ${teacherId}, ${roomId || null}, ${periodId}, ${actorId || null})
          RETURNING *
        `;
        rows.push(row);
      }
      return rows;
    });

    // ── Publication : notifie les enseignants concernés par cette classe ──
    // Le flag notify=true est envoyé par le bouton « Publier » de l'admin.
    // Une erreur de notification ne doit jamais faire échouer la publication.
    if (notify === true && inserted.length > 0) {
      try {
        const teacherIds = [...new Set(inserted.map((r) => r.teacher_id).filter(Boolean))];
        const message = `Votre emploi du temps a été publié — la grille de la classe ${klass.name} est à jour.`;
        const messageEn = `Your timetable has been published — the schedule for class ${klass.name} is up to date.`;
        for (const tid of teacherIds) {
          await notificationService.sendBroadcast(schoolId, {
            audience: 'user',
            userId: tid,
            type: 'system',
            message,
            messageEn,
          });
        }
      } catch {
        // ignore — la publication reste valide
      }
    }

    // Recharge la grille complète de la classe (avec noms) pour le retour
    return this.getGrid(schoolId, { academicYearId: yearId, classId });
  }

  // ------------------------------------------------------------------
  // Unavailabilities (indisponibilités)
  // ------------------------------------------------------------------

  async listUnavailabilities(schoolId, { academicYearId, entityType, entityId } = {}) {
    const yearId = await this._resolveYear(schoolId, academicYearId);
    if (!yearId) return { academicYearId: null, unavailabilities: [] };

    const rows = await sql`
      SELECT u.*, p.day, p.start_time, p.end_time, p.name AS period_name
      FROM timetable_unavailabilities u
      JOIN timetable_periods p ON p.period_id = u.period_id
      WHERE u.school_id = ${schoolId}
        AND u.academic_year_id = ${yearId}
        ${entityType ? sql`AND u.entity_type = ${entityType}` : sql``}
        ${entityId ? sql`AND u.entity_id = ${entityId}` : sql``}
      ORDER BY p.day, p.sort_order
    `;
    return {
      academicYearId: yearId,
      unavailabilities: rows.map((u) => ({
        id: u.unavailability_id,
        entityType: u.entity_type,
        entityId: u.entity_id,
        periodId: u.period_id,
        periodName: u.period_name,
        day: u.day,
        startTime: this._toTime(u.start_time),
        endTime: this._toTime(u.end_time),
        reason: u.reason,
      })),
    };
  }

  async createUnavailability(schoolId, data) {
    const yearId = await this._resolveYear(schoolId, data.academicYearId);
    if (!yearId) throw AppError.badRequest('academicYearId is required (or set an active academic year)');
    await this._assertYear(schoolId, yearId);

    const { entityType, entityId, periodId, reason } = data;
    if (!['teacher', 'class', 'room'].includes(entityType)) {
      throw AppError.badRequest('entityType must be teacher, class or room');
    }
    if (entityType === 'teacher') await this._assertTeacher(schoolId, entityId);
    else if (entityType === 'class') await this._assertClass(schoolId, entityId, yearId);
    else if (entityType === 'room') await this._assertRoom(schoolId, entityId);
    await this._assertPeriod(schoolId, periodId, yearId);

    try {
      const [row] = await sql`
        INSERT INTO timetable_unavailabilities (school_id, academic_year_id, entity_type, entity_id, period_id, reason)
        VALUES (${schoolId}, ${yearId}, ${entityType}, ${entityId}, ${periodId}, ${reason || null})
        RETURNING *
      `;
      return { id: row.unavailability_id, entityType: row.entity_type, entityId: row.entity_id, periodId: row.period_id, reason: row.reason };
    } catch (err) {
      if (err.code === '23505') {
        throw AppError.conflict('This unavailability already exists for the selected period');
      }
      throw err;
    }
  }

  async deleteUnavailability(schoolId, unavailabilityId) {
    const [existing] = await sql`
      SELECT * FROM timetable_unavailabilities
      WHERE unavailability_id = ${unavailabilityId} AND school_id = ${schoolId}
    `;
    if (!existing) throw AppError.notFound('Unavailability not found');
    await sql`
      DELETE FROM timetable_unavailabilities WHERE unavailability_id = ${unavailabilityId}
    `;
    return { id: unavailabilityId };
  }

  // ------------------------------------------------------------------
  // Grid & Today (lecture)
  // ------------------------------------------------------------------

  /**
   * Grille hebdomadaire : créneaux + cours enrichis (noms).
   * Filtres optionnels : classId, teacherId, roomId.
   */
  async getGrid(schoolId, { academicYearId, classId, teacherId, roomId } = {}) {
    const yearId = await this._resolveYear(schoolId, academicYearId);
    if (!yearId) return { academicYearId: null, periods: [], entries: [] };

    const [periods, entries] = await Promise.all([
      sql`
        SELECT * FROM timetable_periods
        WHERE school_id = ${schoolId} AND academic_year_id = ${yearId}
        ORDER BY day, sort_order
      `,
      sql`
        SELECT
          e.*,
          c.name AS class_name,
          s.name AS subject_name,
          CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
          r.name AS room_name,
          p.day,
          p.start_time,
          p.end_time
        FROM timetable_entries e
        JOIN classes c ON c.class_id = e.class_id
        JOIN subjects s ON s.subject_id = e.subject_id
        JOIN users u ON u.user_id = e.teacher_id
        LEFT JOIN rooms r ON r.room_id = e.room_id
        JOIN timetable_periods p ON p.period_id = e.period_id
        WHERE e.school_id = ${schoolId}
          AND e.academic_year_id = ${yearId}
          ${classId ? sql`AND e.class_id = ${classId}` : sql``}
          ${teacherId ? sql`AND e.teacher_id = ${teacherId}` : sql``}
          ${roomId ? sql`AND e.room_id = ${roomId}` : sql``}
        ORDER BY p.day, p.sort_order
      `,
    ]);

    return {
      academicYearId: yearId,
      periods: periods.map((r) => this._formatPeriod(r)),
      entries: entries.map((r) => this._formatEntry(r)),
    };
  }

  /**
   * Emploi du temps « aujourd'hui » — pour les dashboards enseignant / élève.
   * Fournir teacherId (enseignant) OU classId (classe de l'élève).
   */
  async getToday(schoolId, { academicYearId, teacherId, classId } = {}) {
    if (!teacherId && !classId) {
      throw AppError.badRequest('Provide teacherId or classId');
    }

    const yearId = await this._resolveYear(schoolId, academicYearId);
    const now = new Date();
    // JS getDay(): 0=dim … 6=sam → notre convention 1=lun … 7=dim
    const day = ((now.getDay() + 6) % 7) + 1;

    if (!yearId) {
      return {
        date: now.toISOString(),
        day,
        academicYearId: null,
        entries: [],
      };
    }

    const rows = await sql`
      SELECT
        e.*,
        c.name AS class_name,
        s.name AS subject_name,
        CONCAT(u.first_name, ' ', u.last_name) AS teacher_name,
        r.name AS room_name,
        p.day,
        p.start_time,
        p.end_time
      FROM timetable_entries e
      JOIN classes c ON c.class_id = e.class_id
      JOIN subjects s ON s.subject_id = e.subject_id
      JOIN users u ON u.user_id = e.teacher_id
      LEFT JOIN rooms r ON r.room_id = e.room_id
      JOIN timetable_periods p ON p.period_id = e.period_id
      WHERE e.school_id = ${schoolId}
        AND e.academic_year_id = ${yearId}
        AND p.day = ${day}
        ${teacherId ? sql`AND e.teacher_id = ${teacherId}` : sql``}
        ${classId ? sql`AND e.class_id = ${classId}` : sql``}
      ORDER BY p.start_time, p.sort_order
    `;

    return {
      date: now.toISOString(),
      day,
      academicYearId: yearId,
      entries: rows.map((r) => this._formatEntry(r)),
    };
  }
}

module.exports = new TimetableService();
