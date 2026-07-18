const express = require('express');
const inviteController = require('../controllers/invite.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');
const auditMiddleware = require('../middleware/audit.middleware');

const router = express.Router();
router.use(authMiddleware);

// Invite validation schema
const inviteValidator = (req, res, next) => {
  const { email, firstName, lastName, role } = req.body;
  const errors = [];

  if (!email || !email.includes('@')) {
    errors.push('Valid email is required');
  }

  if (!role) {
    errors.push('Role is required');
  }

  const validRoles = ['ADMIN', 'TEACHER', 'STUDENT', 'ACCOUNTANT', 'SECRETARY', 'PARENT'];
  if (role && !validRoles.includes(role.toUpperCase())) {
    errors.push('Invalid role');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

router.post(
  '/send',
  roleMiddleware(['admin']),
  inviteValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('SEND_INVITE', 'invites'),
  inviteController.sendInvite
);

router.get(
  '/validate/:token',
  inviteController.validateInvite
);

router.post(
  '/accept',
  inviteController.acceptInvite
);

router.post(
  '/decline',
  inviteController.declineInvite
);

/**
 * @openapi
 * /api/invites/send:
 *   post:
 *     tags: [Invites]
 *     summary: Send user invitation email
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, role]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ADMIN, TEACHER, STUDENT, ACCOUNTANT, SECRETARY, PARENT]
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden - admin only
 *
 * /api/invites/validate/{token}:
 *   get:
 *     tags: [Invites]
 *     summary: Validate invite token
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Invalid token
 */
module.exports = router;
