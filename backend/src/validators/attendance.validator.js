const { body } = require('express-validator');

const recordAttendanceValidator = [
  body('studentId').isUUID().withMessage('Valid studentId (UUID) is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Status must be present, absent, late, or excused'),
];

const bulkAttendanceValidator = [
  body('records').isArray({ min: 1 }).withMessage('At least one attendance record is required'),
  body('records.*.studentId').isUUID().withMessage('Valid studentId (UUID) is required'),
  body('records.*.status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Status must be present, absent, late, or excused'),
  body('date').isISO8601().withMessage('A valid date (ISO8601) is required'),
  body('classId').isUUID().withMessage('Valid classId (UUID) is required'),
];

module.exports = { recordAttendanceValidator, bulkAttendanceValidator };
