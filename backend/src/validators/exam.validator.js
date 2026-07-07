const { body } = require('express-validator');

const createExamValidator = [
  body('name').trim().notEmpty().withMessage('Exam name is required'),
  body('examDate').isISO8601().withMessage('Valid exam date is required'),
  body('type').optional().trim().isLength({ max: 50 }),
];

const updateExamValidator = [
  body('name').optional().trim().notEmpty(),
  body('examDate').optional().isISO8601(),
  body('status').optional().isIn(['scheduled', 'ongoing', 'completed', 'cancelled']),
];

module.exports = { createExamValidator, updateExamValidator };
