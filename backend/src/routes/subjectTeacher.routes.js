const express = require('express');
const subjectTeacherController = require('../controllers/subjectTeacher.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', subjectTeacherController.list);
router.post(
  '/',
  roleMiddleware(['admin']),
  standardLimiter,
  auditMiddleware('ASSIGN', 'subject_teachers'),
  subjectTeacherController.assign
);
router.get('/subject/:subjectId', subjectTeacherController.listBySubject);
router.get('/teacher/:teacherId', subjectTeacherController.listByTeacher);
router.delete(
  '/:id',
  roleMiddleware(['admin']),
  auditMiddleware('REMOVE', 'subject_teachers'),
  subjectTeacherController.remove
);

/**
 * @openapi
 * /api/subject-teachers:
 *   get:
 *     tags: [Subjects]
 *     summary: List subject-teacher assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of subject-teacher assignments
 *
 *   post:
 *     tags: [Subjects]
 *     summary: Assign a teacher to a subject
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subjectId, teacherId]
 *             properties:
 *               subjectId:
 *                 type: string
 *                 format: uuid
 *               teacherId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Teacher assigned to subject
 *
 * /api/subject-teachers/subject/{subjectId}:
 *   get:
 *     tags: [Subjects]
 *     summary: Get teachers for a subject
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Subject teachers
 *
 * /api/subject-teachers/teacher/{teacherId}:
 *   get:
 *     tags: [Subjects]
 *     summary: Get subjects for a teacher
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Teacher subjects
 *
 * /api/subject-teachers/{id}:
 *   delete:
 *     tags: [Subjects]
 *     summary: Remove a teacher from a subject
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
 *         description: Teacher removed from subject
 */
module.exports = router;
