const { body, param } = require('express-validator');

const createAcademicYearValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Academic year name is required')
    .isLength({ max: 50 })
    .withMessage('Name must be at most 50 characters'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('endDate')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('year')
    .optional()
    .trim(),
];

const updateAcademicYearValidator = [
  param('id').isUUID().withMessage('Academic year ID must be a valid UUID'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Name must be at most 50 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('endDate')
    .optional()
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('year')
    .optional()
    .trim(),
];

const yearIdParamValidator = [
  param('id').isUUID().withMessage('Academic year ID must be a valid UUID'),
];

module.exports = {
  createAcademicYearValidator,
  updateAcademicYearValidator,
  yearIdParamValidator,
};
