/**
 * Class Routes
 */

const express = require('express');
const classController = require('../controllers/class.controller');
const classTeacherController = require('../controllers/classTeacher.controller');
const enrollmentController = require('../controllers/enrollment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { createClassValidator, updateClassValidator } = require('../validators/class.validator');
const { createEnrollmentValidator } = require('../validators/enrollment.validator');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  createClassValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('CREATE', 'classes'),
  classController.createClass
);

router.get('/', authMiddleware, tenantMiddleware, classController.getSchoolClasses);

// ⚠️ Static routes MUST come BEFORE parameterized /:id routes
router.get(
  '/teacher/:teacherId',
  authMiddleware,
  classController.getTeacherClasses
);

router.get('/:id', authMiddleware, classController.getClass);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  updateClassValidator,
  validateMiddleware,
  auditMiddleware('UPDATE', 'classes'),
  classController.updateClass
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  auditMiddleware('DELETE', 'classes'),
  classController.deleteClass
);

router.post(
  '/:id/students',
  authMiddleware,
  roleMiddleware(['admin']),
  createEnrollmentValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('ENROLL', 'enrollments'),
  enrollmentController.create
);

router.delete(
  '/:id/students/:studentId',
  authMiddleware,
  roleMiddleware(['admin']),
  auditMiddleware('REMOVE_STUDENT', 'enrollments'),
  classController.removeStudent
);

// ── Class-Teacher assignments ──
// ⚠️ Static routes MUST come BEFORE parameterized routes

router.get(
  '/teachers/available',
  authMiddleware,
  classTeacherController.availableTeachers
);

router.get(
  '/teachers',
  authMiddleware,
  classTeacherController.listBySchool
);

router.get(
  '/:id/teachers',
  authMiddleware,
  classTeacherController.listByClass
);

router.post(
  '/:id/teachers',
  authMiddleware,
  roleMiddleware(['admin']),
  standardLimiter,
  auditMiddleware('ASSIGN_TEACHER', 'class_teachers'),
  classTeacherController.assign
);

router.delete(
  '/:id/teachers/:teacherId',
  authMiddleware,
  roleMiddleware(['admin']),
  auditMiddleware('REMOVE_TEACHER', 'class_teachers'),
  classTeacherController.remove
);

/**
 * @openapi
 * /api/classes:
 *   post:
 *     tags: [Classes]
 *     summary: Create a new class
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Class created
 *
 *   get:
 *     tags: [Classes]
 *     summary: List all classes for the school
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classes
 *
 * /api/classes/{id}:
 *   get:
 *     tags: [Classes]
 *     summary: Get a class by ID
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
 *         description: Class details
 *
 *   put:
 *     tags: [Classes]
 *     summary: Update a class
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
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Class updated
 *
 *   delete:
 *     tags: [Classes]
 *     summary: Delete a class
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
 *         description: Class deleted
 *
 * /api/classes/{id}/students:
 *   post:
 *     tags: [Classes]
 *     summary: Enroll students in a class
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
 *             required: [studentIds]
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Students enrolled
 *
 * /api/classes/{id}/students/{studentId}:
 *   delete:
 *     tags: [Classes]
 *     summary: Remove a student from a class
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Student removed from class
 */
module.exports = router;
