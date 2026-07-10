const { body } = require('express-validator');

const createPeriodValidator = [
  body('name').trim().notEmpty().withMessage('Period name is required'),
  body('type').isIn(['term', 'semester', 'sequence', 'ca', 'exam']).withMessage('Invalid period type'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('academicYearId').optional().isInt(),
];

const updatePeriodValidator = [
  body('name').optional().trim().notEmpty(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('isCurrent').optional().isBoolean(),
];

module.exports = { createPeriodValidator, updatePeriodValidator };
