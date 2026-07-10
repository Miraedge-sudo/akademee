const { body } = require('express-validator');

const createFeeValidator = [
  body('name').trim().notEmpty().withMessage('Fee name is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('classId').optional().isInt(),
  body('description').optional().trim().isLength({ max: 500 }),
];

const updateFeeValidator = [
  body('name').optional().trim().notEmpty(),
  body('amount').optional().isFloat({ min: 0 }),
  body('classId').optional().isInt(),
];

module.exports = { createFeeValidator, updateFeeValidator };
