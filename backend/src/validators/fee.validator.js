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
  // replace=false → au moins un frais ; replace=true → tableau peut être vide
  // (décocher tous les frais de la classe). Vérifié dans le contrôleur.
  body('feeIds')
    .isArray()
    .withMessage('feeIds must be an array'),
  body('feeIds.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Fee ID cannot be empty'),
  body('academicYearId')
    .optional({ values: 'null' })
    .trim()
    .notEmpty()
    .withMessage('Academic year ID cannot be empty'),
  body('replace')
    .optional()
    .isBoolean()
    .withMessage('replace must be a boolean'),
];

module.exports = { createFeeValidator, updateFeeValidator, assignFeesValidator };
