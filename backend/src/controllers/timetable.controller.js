/**
 * Timetable Controller — Emploi du temps V1
 *
 * REST handlers for the timetable API. Delegates business logic (including
 * conflict detection) to TimetableService.
 */

const timetableService = require('../services/timetable.service');
const response = require('../utils/response');

class TimetableController {
  // ------------------------------------------------------------------
  // Periods
  // ------------------------------------------------------------------
  async listPeriods(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const data = await timetableService.listPeriods(schoolId, { academicYearId: req.query.academicYearId });
      response.success(res, 'Periods retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  async createPeriod(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const data = await timetableService.createPeriod(schoolId, req.body);
      response.success(res, 'Period created', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async createPeriods(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const data = await timetableService.createPeriods(schoolId, req.body);
      response.success(res, 'Periods created', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async updatePeriod(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { periodId } = req.params;
      const data = await timetableService.updatePeriod(schoolId, periodId, req.body);
      response.success(res, 'Period updated', data);
    } catch (err) {
      next(err);
    }
  }

  async deletePeriod(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { periodId } = req.params;
      const data = await timetableService.deletePeriod(schoolId, periodId, {
        force: req.query.force === 'true',
      });
      response.success(res, 'Period deleted', data);
    } catch (err) {
      next(err);
    }
  }

  // ------------------------------------------------------------------
  // Rooms
  // ------------------------------------------------------------------
  async listRooms(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const data = await timetableService.listRooms(schoolId);
      response.success(res, 'Rooms retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  async createRoom(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const data = await timetableService.createRoom(schoolId, req.body);
      response.success(res, 'Room created', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateRoom(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { roomId } = req.params;
      const data = await timetableService.updateRoom(schoolId, roomId, req.body);
      response.success(res, 'Room updated', data);
    } catch (err) {
      next(err);
    }
  }

  async deleteRoom(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { roomId } = req.params;
      const data = await timetableService.deleteRoom(schoolId, roomId);
      response.success(res, 'Room deleted', data);
    } catch (err) {
      next(err);
    }
  }

  // ------------------------------------------------------------------
  // Entries
  // ------------------------------------------------------------------
  async listEntries(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { academicYearId, classId, teacherId, roomId } = req.query;
      const data = await timetableService.listEntries(schoolId, { academicYearId, classId, teacherId, roomId });
      response.success(res, 'Timetable entries retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  async createEntry(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const actorId = req.user?.userId;
      const data = await timetableService.createEntry(schoolId, req.body, actorId);
      response.success(res, 'Timetable entry created', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async updateEntry(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { entryId } = req.params;
      const data = await timetableService.updateEntry(schoolId, entryId, req.body);
      response.success(res, 'Timetable entry updated', data);
    } catch (err) {
      next(err);
    }
  }

  async deleteEntry(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { entryId } = req.params;
      const data = await timetableService.deleteEntry(schoolId, entryId);
      response.success(res, 'Timetable entry deleted', data);
    } catch (err) {
      next(err);
    }
  }

  async replaceClassEntries(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const actorId = req.user?.userId;
      // classId vient de l'URL (PUT /classes/:classId/entries) — pas du body.
      const data = await timetableService.replaceClassEntries(schoolId, {
        ...req.body,
        classId: req.params.classId,
      }, actorId);
      response.success(res, 'Class timetable replaced', data);
    } catch (err) {
      next(err);
    }
  }

  // ------------------------------------------------------------------
  // Unavailabilities
  // ------------------------------------------------------------------
  async listUnavailabilities(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { academicYearId, entityType, entityId } = req.query;
      const data = await timetableService.listUnavailabilities(schoolId, { academicYearId, entityType, entityId });
      response.success(res, 'Unavailabilities retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  async createUnavailability(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const data = await timetableService.createUnavailability(schoolId, req.body);
      response.success(res, 'Unavailability created', data, 201);
    } catch (err) {
      next(err);
    }
  }

  async deleteUnavailability(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { unavailabilityId } = req.params;
      const data = await timetableService.deleteUnavailability(schoolId, unavailabilityId);
      response.success(res, 'Unavailability deleted', data);
    } catch (err) {
      next(err);
    }
  }

  // ------------------------------------------------------------------
  // Grid & Today
  // ------------------------------------------------------------------
  async getGrid(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { academicYearId, classId, teacherId, roomId } = req.query;
      const data = await timetableService.getGrid(schoolId, { academicYearId, classId, teacherId, roomId });
      response.success(res, 'Timetable grid retrieved', data);
    } catch (err) {
      next(err);
    }
  }

  async getToday(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { academicYearId, teacherId, classId } = req.query;
      const data = await timetableService.getToday(schoolId, { academicYearId, teacherId, classId });
      response.success(res, "Today's timetable retrieved", data);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TimetableController();
