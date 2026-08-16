/**
 * Timetable validators — Emploi du temps V1
 */

const { body, param } = require('express-validator');

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const isTime = (value) => TIME_PATTERN.test(value);

// ── Periods ──
const createPeriodValidator = [
  body('academicYearId').optional().isUUID().withMessage('Valid academicYearId is required'),
  body('name').trim().notEmpty().withMessage('Period name is required').isLength({ max: 100 }),
  body('day').isInt({ min: 1, max: 7 }).withMessage('day must be between 1 (Monday) and 7 (Sunday)'),
  body('startTime').custom(isTime).withMessage('startTime must be HH:MM'),
  body('endTime').custom(isTime).withMessage('endTime must be HH:MM'),
  body('isBreak').optional().isBoolean().withMessage('isBreak must be a boolean'),
  body('sortOrder').optional().isInt().withMessage('sortOrder must be an integer'),
];

const bulkPeriodsValidator = [
  body('academicYearId').optional().isUUID().withMessage('Valid academicYearId is required'),
  body('periods').isArray({ min: 1 }).withMessage('Provide at least one period'),
  body('periods.*.name').trim().notEmpty().withMessage('Each period requires a name'),
  body('periods.*.day').isInt({ min: 1, max: 7 }).withMessage('day must be between 1 and 7'),
  body('periods.*.startTime').custom(isTime).withMessage('startTime must be HH:MM'),
  body('periods.*.endTime').custom(isTime).withMessage('endTime must be HH:MM'),
  body('periods.*.isBreak').optional().isBoolean(),
  body('periods.*.sortOrder').optional().isInt(),
];

const updatePeriodValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('day').optional().isInt({ min: 1, max: 7 }),
  body('startTime').optional().custom(isTime),
  body('endTime').optional().custom(isTime),
  body('isBreak').optional().isBoolean(),
  body('sortOrder').optional().isInt(),
];

const periodIdParamValidator = [
  param('periodId').isUUID().withMessage('Valid period id is required'),
];

// ── Rooms ──
const createRoomValidator = [
  body('name').trim().notEmpty().withMessage('Room name is required').isLength({ max: 100 }),
  body('capacity').optional().isInt({ min: 0 }).withMessage('capacity must be a positive integer'),
  body('roomType').optional().trim().isLength({ max: 50 }),
];

const updateRoomValidator = [
  body('name').optional().trim().notEmpty().isLength({ max: 100 }),
  body('capacity').optional().isInt({ min: 0 }),
  body('roomType').optional().trim().isLength({ max: 50 }),
];

const roomIdParamValidator = [
  param('roomId').isUUID().withMessage('Valid room id is required'),
];

// ── Entries ──
const createEntryValidator = [
  body('academicYearId').optional().isUUID().withMessage('Valid academicYearId is required'),
  body('classId').isUUID().withMessage('Valid classId is required'),
  body('subjectId').isUUID().withMessage('Valid subjectId is required'),
  body('teacherId').isUUID().withMessage('Valid teacherId is required'),
  body('roomId').optional({ values: 'falsy' }).isUUID().withMessage('Valid roomId is required'),
  body('periodId').isUUID().withMessage('Valid periodId is required'),
];

const updateEntryValidator = [
  body('classId').optional().isUUID(),
  body('subjectId').optional().isUUID(),
  body('teacherId').optional().isUUID(),
  body('roomId').optional({ values: 'falsy' }).isUUID(),
  body('periodId').optional().isUUID(),
];

const entryIdParamValidator = [
  param('entryId').isUUID().withMessage('Valid entry id is required'),
];

const replaceClassEntriesValidator = [
  param('classId').isUUID().withMessage('Valid classId is required'),
  body('academicYearId').optional().isUUID(),
  body('notify').optional().isBoolean().withMessage('notify must be a boolean'),
  body('entries').isArray().withMessage('entries must be an array (possibly empty)'),
  body('entries.*.subjectId').isUUID(),
  body('entries.*.teacherId').isUUID(),
  body('entries.*.roomId').optional({ values: 'falsy' }).isUUID(),
  body('entries.*.periodId').isUUID(),
];

// ── Unavailabilities ──
const createUnavailabilityValidator = [
  body('academicYearId').optional().isUUID(),
  body('entityType').isIn(['teacher', 'class', 'room']).withMessage('entityType must be teacher, class or room'),
  body('entityId').isUUID().withMessage('Valid entityId is required'),
  body('periodId').isUUID().withMessage('Valid periodId is required'),
  body('reason').optional().trim().isLength({ max: 200 }),
];

const unavailabilityIdParamValidator = [
  param('unavailabilityId').isUUID().withMessage('Valid unavailability id is required'),
];

module.exports = {
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
};
