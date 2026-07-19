const { body } = require('express-validator');

const createClassValidator = [
  body('name').trim().notEmpty().withMessage('Class name is required'),
  body('capacity').optional().isInt({ min: 1, max: 500 }).withMessage('Capacity must be 1-500'),
  body('levelId').optional({ nullable: true }).isUUID().withMessage('Invalid level ID'),
  body('seriesId').optional({ nullable: true }).isUUID().withMessage('Invalid series ID'),
];

const updateClassValidator = [
  body('name').optional().trim().notEmpty(),
  body('capacity').optional().isInt({ min: 1, max: 500 }),
  body('classTeacherId').optional().isUUID(),
  body('levelId').optional({ values: 'null' }).isUUID().withMessage('Invalid level ID'),
  body('seriesId').optional({ values: 'null' }).isUUID().withMessage('Invalid series ID'),
];

module.exports = { createClassValidator, updateClassValidator };
