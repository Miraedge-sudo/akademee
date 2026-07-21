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

const assignFeesValidator = [
  body('classId')
    .trim()
    .notEmpty()
    .withMessage('Class ID is required'),
  body('feeIds')
    .isArray({ min: 1 })
    .withMessage('At least one fee must be selected'),
  body('feeIds.*')
    .trim()
    .notEmpty()
    .withMessage('Fee ID cannot be empty'),
  body('academicYearId')
    .optional({ values: 'null' })
    .trim()
    .notEmpty()
    .withMessage('Academic year ID cannot be empty'),
];

module.exports = { createFeeValidator, updateFeeValidator, assignFeesValidator };
