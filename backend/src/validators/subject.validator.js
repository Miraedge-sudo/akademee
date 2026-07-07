const { body } = require('express-validator');

const createSubjectValidator = [
  body('name').trim().notEmpty().withMessage('Subject name is required'),
  body('coefficient').optional().isInt({ min: 1, max: 10 }).withMessage('Coefficient must be 1-10'),
  body('credits').optional().isInt({ min: 0, max: 20 }),
];

const updateSubjectValidator = [
  body('name').optional().trim().notEmpty(),
  body('coefficient').optional().isInt({ min: 1, max: 10 }),
  body('credits').optional().isInt({ min: 0, max: 20 }),
];

module.exports = { createSubjectValidator, updateSubjectValidator };
