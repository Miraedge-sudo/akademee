const express = require('express');
const userManagementController = require('../controllers/userManagement.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { createUserValidator, updateUserValidator } = require('../validators/userManagement.validator');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', roleMiddleware(['admin']), userManagementController.list);
router.post(
  '/',
  roleMiddleware(['admin']),
  createUserValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('CREATE', 'users'),
  userManagementController.create
);
router.get('/:id', roleMiddleware(['admin']), userManagementController.getById);
router.put(
  '/:id',
  roleMiddleware(['admin']),
  updateUserValidator,
  validateMiddleware,
  auditMiddleware('UPDATE', 'users'),
  userManagementController.update
);
router.delete(
  '/:id',
  roleMiddleware(['admin']),
  auditMiddleware('DELETE', 'users'),
  userManagementController.delete
);

/**
 * @openapi
 * /api/users/manage:
 *   get:
 *     tags: [User Management]
 *     summary: List all users (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 *
 *   post:
 *     tags: [User Management]
 *     summary: Create a new user (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, role]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User created
 *
 * /api/users/manage/{id}:
 *   get:
 *     tags: [User Management]
 *     summary: Get a user by ID (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User details
 *
 *   put:
 *     tags: [User Management]
 *     summary: Update a user (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *
 *   delete:
 *     tags: [User Management]
 *     summary: Delete a user (admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted
 */
module.exports = router;
