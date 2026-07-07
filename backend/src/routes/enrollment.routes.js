const express = require('express');
const enrollmentController = require('../controllers/enrollment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { createEnrollmentValidator, updateEnrollmentStatusValidator } = require('../validators/enrollment.validator');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', enrollmentController.list);
router.post(
  '/',
  roleMiddleware(['admin']),
  createEnrollmentValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('CREATE', 'enrollments'),
  enrollmentController.create
);
router.get('/student/:studentId', enrollmentController.listByStudent);
router.get('/:id', enrollmentController.getById);
router.put(
  '/:id/status',
  roleMiddleware(['admin']),
  updateEnrollmentStatusValidator,
  validateMiddleware,
  auditMiddleware('UPDATE', 'enrollments'),
  enrollmentController.updateStatus
);
router.post(
  '/:id/transfer',
  roleMiddleware(['admin']),
  standardLimiter,
  auditMiddleware('TRANSFER', 'enrollments'),
  enrollmentController.transfer
);
router.delete(
  '/:id',
  roleMiddleware(['admin']),
  auditMiddleware('DELETE', 'enrollments'),
  enrollmentController.delete
);

/**
 * @openapi
 * /api/enrollments:
 *   get:
 *     tags: [Enrollments]
 *     summary: List all enrollments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of enrollments
 *
 *   post:
 *     tags: [Enrollments]
 *     summary: Create an enrollment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, classId, academicYearId]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *               classId:
 *                 type: string
 *                 format: uuid
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Enrollment created
 *
 * /api/enrollments/student/{studentId}:
 *   get:
 *     tags: [Enrollments]
 *     summary: List enrollments for a student
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
 *         description: Student enrollments
 *
 * /api/enrollments/{id}:
 *   get:
 *     tags: [Enrollments]
 *     summary: Get an enrollment by ID
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
 *         description: Enrollment details
 *
 *   delete:
 *     tags: [Enrollments]
 *     summary: Delete an enrollment
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
 *         description: Enrollment deleted
 *
 * /api/enrollments/{id}/status:
 *   put:
 *     tags: [Enrollments]
 *     summary: Update enrollment status
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, graduated, transferred]
 *     responses:
 *       200:
 *         description: Enrollment status updated
 *
 * /api/enrollments/{id}/transfer:
 *   post:
 *     tags: [Enrollments]
 *     summary: Transfer a student to another class
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
 *             required: [targetClassId]
 *             properties:
 *               targetClassId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Student transferred
 */
module.exports = router;
