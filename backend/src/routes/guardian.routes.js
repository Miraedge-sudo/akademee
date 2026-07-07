/**
 * Guardian Routes — all endpoints require auth + tenant (school isolation).
 */

const express = require('express');
const guardianController = require('../controllers/guardian.controller');
const authMiddleware = require('../middleware/auth.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const { createGuardianValidator, updateGuardianValidator } = require('../validators/guardian.validator');

const router = express.Router();

router.use(authMiddleware, tenantMiddleware);

router.post(
  '/',
  roleMiddleware(['admin', 'teacher']),
  createGuardianValidator,
  validateMiddleware,
  guardianController.createGuardian
);

router.get(
  '/',
  roleMiddleware(['admin', 'teacher', 'accountant']),
  guardianController.listAllGuardians
);

router.get(
  '/student/:studentId',
  roleMiddleware(['admin', 'teacher', 'accountant']),
  guardianController.getStudentGuardians
);

router.get(
  '/:id',
  roleMiddleware(['admin', 'teacher', 'accountant']),
  guardianController.getGuardian
);

router.put(
  '/:id',
  roleMiddleware(['admin', 'teacher']),
  updateGuardianValidator,
  validateMiddleware,
  guardianController.updateGuardian
);

router.delete(
  '/:id',
  roleMiddleware(['admin']),
  guardianController.deleteGuardian
);

/**
 * @openapi
 * /api/guardians:
 *   post:
 *     tags: [Guardians]
 *     summary: Create a new guardian
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               relationship:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               address:
 *                 type: string
 *               studentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Guardian created
 *
 *   get:
 *     tags: [Guardians]
 *     summary: List all guardians
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
 *     responses:
 *       200:
 *         description: List of guardians
 *
 * /api/guardians/student/{studentId}:
 *   get:
 *     tags: [Guardians]
 *     summary: Get guardians for a student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Student guardians
 *
 * /api/guardians/{id}:
 *   get:
 *     tags: [Guardians]
 *     summary: Get a guardian by ID
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
 *         description: Guardian details
 *
 *   put:
 *     tags: [Guardians]
 *     summary: Update a guardian
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
 *               relationship:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Guardian updated
 *
 *   delete:
 *     tags: [Guardians]
 *     summary: Delete a guardian
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
 *         description: Guardian deleted
 */
module.exports = router;
