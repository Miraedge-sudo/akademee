const { body } = require('express-validator');

const createEnrollmentValidator = [
  body('studentId').isInt().withMessage('studentId is required'),
  body('classId').isInt().withMessage('classId is required'),
  body('academicYearId').optional().isInt(),
];

const updateEnrollmentStatusValidator = [
  body('status').isIn(['active', 'withdrawn', 'transferred', 'graduated']).withMessage('Invalid status'),
];

module.exports = { createEnrollmentValidator, updateEnrollmentStatusValidator };
