/**
 * Notification validators
 */

const { body } = require('express-validator');

const AUDIENCES = ['user', 'all', 'role', 'class'];
const TYPES = ['grade', 'attendance', 'payment', 'discipline', 'system', 'announcement'];

const sendNotificationValidator = [
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 500 }),
  body('type')
    .optional()
    .isIn(TYPES)
    .withMessage(`type must be one of: ${TYPES.join(', ')}`),
  body('audience')
    .optional()
    .isIn(AUDIENCES)
    .withMessage(`audience must be one of: ${AUDIENCES.join(', ')}`),
  body('userId').optional().isUUID().withMessage('Valid userId is required'),
  body('role').optional().trim().notEmpty().withMessage('role must be a non-empty string'),
  body('classId').optional().isUUID().withMessage('Valid classId is required'),
  // Cohérence audience <-> champs requis
  body().custom((_, { req }) => {
    const b = req.body || {};
    const audience = b.audience || 'user';
    if (audience === 'user' && !b.userId) {
      throw new Error('userId is required for audience=user');
    }
    if (audience === 'role' && !b.role) {
      throw new Error('role is required for audience=role');
    }
    if (audience === 'class' && !b.classId) {
      throw new Error('classId is required for audience=class');
    }
    return true;
  }),
];

module.exports = { sendNotificationValidator, AUDIENCES, TYPES };
