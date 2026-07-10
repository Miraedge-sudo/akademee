const { body } = require('express-validator');

const recordAttendanceValidator = [
  body('studentId').isInt().withMessage('studentId is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('status').isIn(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']).withMessage('Invalid status'),
];

const bulkAttendanceValidator = [
  body('attendanceData').isArray({ min: 1 }).withMessage('attendanceData array is required'),
  body('attendanceData.*.studentId').isInt(),
  body('attendanceData.*.date').isISO8601(),
  body('attendanceData.*.status').isIn(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
];

module.exports = { recordAttendanceValidator, bulkAttendanceValidator };
