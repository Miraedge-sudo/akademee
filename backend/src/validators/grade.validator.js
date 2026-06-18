/**
 * Grade Validators
 */

const { body, param } = require('express-validator');

const recordGradeValidator = [
  body('studentId').notEmpty(),
  body('subjectId').notEmpty(),
  body('periodId').notEmpty(),
  body('score').isFloat({ min: 0, max: 100 }),
];

const updateGradeValidator = [
  param('id').isUUID(),
  body('score').isFloat({ min: 0, max: 100 }),
];

const bulkUploadGradesValidator = [
  // Validate file upload
  // body('file').notEmpty(),
];

module.exports = {
  recordGradeValidator,
  updateGradeValidator,
  bulkUploadGradesValidator,
};
