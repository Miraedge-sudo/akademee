const express = require('express');
const roleController = require('../controllers/role.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', roleController.listRoles);
router.get('/permissions', roleController.listPermissions);
router.get('/:userId', roleController.getUserRoles);
router.post(
  '/:userId/assign',
  roleMiddleware(['admin']),
  standardLimiter,
  auditMiddleware('ASSIGN_ROLE', 'user_roles'),
  roleController.assignRole
);
router.delete(
  '/:userId/role/:roleCode',
  roleMiddleware(['admin']),
  auditMiddleware('REMOVE_ROLE', 'user_roles'),
  roleController.removeRole
);

router.get('/permissions/:roleCode', roleController.getRolePermissions);
router.post(
  '/permissions/:roleCode/assign',
  roleMiddleware(['admin']),
  standardLimiter,
  auditMiddleware('ASSIGN_PERMISSION', 'role_permissions'),
  roleController.assignPermission
);
router.delete(
  '/permissions/:roleCode/:permissionCode',
  roleMiddleware(['admin']),
  auditMiddleware('REMOVE_PERMISSION', 'role_permissions'),
  roleController.removePermission
);

/**
 * @openapi
 * /api/roles:
 *   get:
 *     tags: [Roles]
 *     summary: List all roles
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 *
 * /api/roles/permissions:
 *   get:
 *     tags: [Roles]
 *     summary: List all permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of permissions
 *
 * /api/roles/permissions/{roleCode}:
 *   get:
 *     tags: [Roles]
 *     summary: Get permissions for a role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role permissions
 *
 * /api/roles/permissions/{roleCode}/assign:
 *   post:
 *     tags: [Roles]
 *     summary: Assign a permission to a role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleCode
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [permissionCode]
 *             properties:
 *               permissionCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Permission assigned
 *
 * /api/roles/permissions/{roleCode}/{permissionCode}:
 *   delete:
 *     tags: [Roles]
 *     summary: Remove a permission from a role
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleCode
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permissionCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Permission removed
 *
 * /api/roles/{userId}:
 *   get:
 *     tags: [Roles]
 *     summary: Get roles for a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User roles
 *
 * /api/roles/{userId}/assign:
 *   post:
 *     tags: [Roles]
 *     summary: Assign a role to a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *             required: [roleCode]
 *             properties:
 *               roleCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role assigned
 *
 * /api/roles/{userId}/role/{roleCode}:
 *   delete:
 *     tags: [Roles]
 *     summary: Remove a role from a user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: roleCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Role removed
 */
module.exports = router;
