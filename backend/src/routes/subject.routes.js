/**
 * Subject Routes
 */

const express = require('express');
const subjectController = require('../controllers/subject.controller');
const classSubjectController = require('../controllers/classSubject.controller');
const subjectTeacherController = require('../controllers/subjectTeacher.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { createSubjectValidator, updateSubjectValidator } = require('../validators/subject.validator');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  createSubjectValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('CREATE', 'subjects'),
  subjectController.createSubject
);

router.get('/', authMiddleware, subjectController.getAllSubjects);

router.get('/:id', authMiddleware, subjectController.getSubject);

router.get('/class/:classId', authMiddleware, subjectController.getClassSubjects);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  updateSubjectValidator,
  validateMiddleware,
  auditMiddleware('UPDATE', 'subjects'),
  subjectController.updateSubject
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  auditMiddleware('DELETE', 'subjects'),
  subjectController.deleteSubject
);

router.post(
  '/:id/classes',
  authMiddleware,
  roleMiddleware(['admin']),
  standardLimiter,
  auditMiddleware('ASSIGN_CLASS', 'class_subjects'),
  classSubjectController.assign
);

router.post(
  '/:id/teachers',
  authMiddleware,
  roleMiddleware(['admin']),
  standardLimiter,
  auditMiddleware('ASSIGN_TEACHER', 'subject_teachers'),
  subjectTeacherController.assign
);

/**
 * @openapi
 * /api/subjects:
 *   post:
 *     tags: [Subjects]
 *     summary: Create a new subject
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subject created
 *
 *   get:
 *     tags: [Subjects]
 *     summary: List all subjects
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subjects
 *
 * /api/subjects/{id}:
 *   get:
 *     tags: [Subjects]
 *     summary: Get a subject by ID
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
 *         description: Subject details
 *
 *   put:
 *     tags: [Subjects]
 *     summary: Update a subject
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
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subject updated
 *
 *   delete:
 *     tags: [Subjects]
 *     summary: Delete a subject
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
 *         description: Subject deleted
 *
 * /api/subjects/class/{classId}:
 *   get:
 *     tags: [Subjects]
 *     summary: Get subjects for a class
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
 * /api/subjects/{id}/classes:
 *   post:
 *     tags: [Subjects]
 *     summary: Assign subject to a class
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
 *             required: [classId]
 *             properties:
 *               classId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Subject assigned to class
 *
 * /api/subjects/{id}/teachers:
 *   post:
 *     tags: [Subjects]
 *     summary: Assign a teacher to a subject
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
 *             required: [teacherId]
 *             properties:
 *               teacherId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Teacher assigned to subject
 */
module.exports = router;
