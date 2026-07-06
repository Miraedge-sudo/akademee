const express = require('express');
const classSubjectController = require('../controllers/classSubject.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', classSubjectController.list);
router.post(
  '/',
  roleMiddleware(['admin']),
  standardLimiter,
  auditMiddleware('ASSIGN', 'class_subjects'),
  classSubjectController.assign
);
router.post(
  '/bulk',
  roleMiddleware(['admin']),
  standardLimiter,
  auditMiddleware('BULK_ASSIGN', 'class_subjects'),
  classSubjectController.bulkAssign
);
router.get('/class/:classId', classSubjectController.listByClass);
router.delete(
  '/:id',
  roleMiddleware(['admin']),
  auditMiddleware('REMOVE', 'class_subjects'),
  classSubjectController.remove
);

/**
 * @openapi
 * /api/class-subjects:
 *   get:
 *     tags: [Classes]
 *     summary: List class-subject assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of class-subject assignments
 *
 *   post:
 *     tags: [Classes]
 *     summary: Assign a subject to a class
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, subjectId]
 *             properties:
 *               classId:
 *                 type: string
 *                 format: uuid
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Subject assigned to class
 *
 * /api/class-subjects/bulk:
 *   post:
 *     tags: [Classes]
 *     summary: Bulk assign subjects to classes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [assignments]
 *             properties:
 *               assignments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [classId, subjectId]
 *                   properties:
 *                     classId:
 *                       type: string
 *                       format: uuid
 *                     subjectId:
 *                       type: string
 *                       format: uuid
 *     responses:
 *       201:
 *         description: Subjects assigned
 *
 * /api/class-subjects/class/{classId}:
 *   get:
 *     tags: [Classes]
 *     summary: Get subjects assigned to a class
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Class subjects
 *
 * /api/class-subjects/{id}:
 *   delete:
 *     tags: [Classes]
 *     summary: Remove a subject from a class
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
 *         description: Subject removed from class
 */
module.exports = router;
