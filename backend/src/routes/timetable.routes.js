/**
 * Timetable Routes — Emploi du temps V1
 *
 * Mounted at /api/timetable in app.js.
 *
 * Écriture (créneaux, salles, cours, indisponibilités) : admin + secrétaire.
 * Lecture (grille, aujourd'hui) : tous les rôles connectés (élèves/parents
 * consultent l'emploi du temps de leur classe via classId).
 */

const express = require('express');
const timetableController = require('../controllers/timetable.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { invalidateCache } = require('../middleware/cache.middleware');
const {
  createPeriodValidator,
  bulkPeriodsValidator,
  updatePeriodValidator,
  periodIdParamValidator,
  createRoomValidator,
  updateRoomValidator,
  roomIdParamValidator,
  createEntryValidator,
  updateEntryValidator,
  entryIdParamValidator,
  replaceClassEntriesValidator,
  createUnavailabilityValidator,
  unavailabilityIdParamValidator,
} = require('../validators/timetable.validator');

const router = express.Router();
router.use(invalidateCache('http'));

const MANAGE = ['admin', 'secretary'];
const VIEW = ['admin', 'secretary', 'teacher', 'student', 'parent'];

// Libellé humain pour le fil d'activités (dashboard « Recent Activities »)
const entryDetails = (req, data) => {
  if (!data) return null;
  const parts = [data.subjectName, data.className, data.startTime ? `${data.startTime}${data.endTime ? `-${data.endTime}` : ''}` : null]
    .filter(Boolean);
  return parts.join(' — ') || null;
};

// ------------------------------------------------------------------
// Periods (créneaux)
// ------------------------------------------------------------------
router.get('/periods', authMiddleware, roleMiddleware(VIEW), timetableController.listPeriods);
router.post('/periods', authMiddleware, roleMiddleware(MANAGE), createPeriodValidator, validateMiddleware,
  auditMiddleware('CREATE', 'timetable_periods', (req, data) => data?.name || null),
  timetableController.createPeriod);
router.post('/periods/bulk', authMiddleware, roleMiddleware(MANAGE), bulkPeriodsValidator, validateMiddleware,
  auditMiddleware('CREATE', 'timetable_periods', (req, data) => `${data?.periods?.length || 0} periods`),
  timetableController.createPeriods);
router.put('/periods/:periodId', authMiddleware, roleMiddleware(MANAGE), updatePeriodValidator, periodIdParamValidator, validateMiddleware,
  auditMiddleware('UPDATE', 'timetable_periods', (req, data) => data?.name || null),
  timetableController.updatePeriod);
router.delete('/periods/:periodId', authMiddleware, roleMiddleware(MANAGE), periodIdParamValidator, validateMiddleware,
  auditMiddleware('DELETE', 'timetable_periods'),
  timetableController.deletePeriod);

// ------------------------------------------------------------------
// Rooms (salles)
// ------------------------------------------------------------------
router.get('/rooms', authMiddleware, roleMiddleware(VIEW), timetableController.listRooms);
router.post('/rooms', authMiddleware, roleMiddleware(MANAGE), createRoomValidator, validateMiddleware,
  auditMiddleware('CREATE', 'rooms', (req, data) => data?.name || null),
  timetableController.createRoom);
router.put('/rooms/:roomId', authMiddleware, roleMiddleware(MANAGE), updateRoomValidator, roomIdParamValidator, validateMiddleware,
  auditMiddleware('UPDATE', 'rooms', (req, data) => data?.name || null),
  timetableController.updateRoom);
router.delete('/rooms/:roomId', authMiddleware, roleMiddleware(MANAGE), roomIdParamValidator, validateMiddleware,
  auditMiddleware('DELETE', 'rooms', (req, data) => data?.id || null),
  timetableController.deleteRoom);

// ------------------------------------------------------------------
// Entries (cours)
// ------------------------------------------------------------------
router.get('/entries', authMiddleware, roleMiddleware(VIEW), timetableController.listEntries);
router.post('/entries', authMiddleware, roleMiddleware(MANAGE), createEntryValidator, validateMiddleware,
  auditMiddleware('CREATE', 'timetable_entries', entryDetails),
  timetableController.createEntry);
router.put('/entries/:entryId', authMiddleware, roleMiddleware(MANAGE), updateEntryValidator, entryIdParamValidator, validateMiddleware,
  auditMiddleware('UPDATE', 'timetable_entries', entryDetails),
  timetableController.updateEntry);
router.delete('/entries/:entryId', authMiddleware, roleMiddleware(MANAGE), entryIdParamValidator, validateMiddleware,
  auditMiddleware('DELETE', 'timetable_entries'),
  timetableController.deleteEntry);
// Remplacement de la grille complète d'une classe
router.put('/classes/:classId/entries', authMiddleware, roleMiddleware(MANAGE), replaceClassEntriesValidator, validateMiddleware,
  auditMiddleware('UPDATE', 'timetable_entries', (req, data) => `${data?.entries?.length || 0} lessons`),
  timetableController.replaceClassEntries);

// ------------------------------------------------------------------
// Unavailabilities (indisponibilités)
// ------------------------------------------------------------------
router.get('/unavailabilities', authMiddleware, roleMiddleware(VIEW), timetableController.listUnavailabilities);
router.post('/unavailabilities', authMiddleware, roleMiddleware(MANAGE), createUnavailabilityValidator, validateMiddleware,
  auditMiddleware('CREATE', 'timetable_unavailabilities'),
  timetableController.createUnavailability);
router.delete('/unavailabilities/:unavailabilityId', authMiddleware, roleMiddleware(MANAGE), unavailabilityIdParamValidator, validateMiddleware,
  auditMiddleware('DELETE', 'timetable_unavailabilities'),
  timetableController.deleteUnavailability);

// ------------------------------------------------------------------
// Grid & Today (lecture)
// ------------------------------------------------------------------
router.get('/grid', authMiddleware, roleMiddleware(VIEW), timetableController.getGrid);
router.get('/today', authMiddleware, roleMiddleware(VIEW), timetableController.getToday);

module.exports = router;
