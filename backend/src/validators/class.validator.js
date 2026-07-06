const { body } = require('express-validator');

const createClassValidator = [
  body('name').trim().notEmpty().withMessage('Class name is required'),
  body('capacity').optional().isInt({ min: 1, max: 500 }).withMessage('Capacity must be 1-500'),
];

const updateClassValidator = [
  body('name').optional().trim().notEmpty(),
  body('capacity').optional().isInt({ min: 1, max: 500 }),
  body('classTeacherId').optional().isInt(),
];

module.exports = { createClassValidator, updateClassValidator };
