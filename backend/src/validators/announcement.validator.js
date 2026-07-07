const { body } = require('express-validator');

const createAnnouncementValidator = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 255 }),
  body('content').trim().notEmpty().withMessage('Content is required'),
  body('targetAudience').optional().isIn(['all', 'teachers', 'students', 'parents']),
  body('priority').optional().isIn(['low', 'normal', 'high']),
];

const updateAnnouncementValidator = [
  body('title').optional().trim().notEmpty().isLength({ max: 255 }),
  body('content').optional().trim().notEmpty(),
  body('targetAudience').optional().isIn(['all', 'teachers', 'students', 'parents']),
  body('priority').optional().isIn(['low', 'normal', 'high']),
  body('isPublished').optional().isBoolean(),
];

module.exports = { createAnnouncementValidator, updateAnnouncementValidator };
