/**
 * Student Routes — all endpoints require auth + tenant; data isolated by school_id.
 */

const express = require('express');
const studentController = require('../controllers/student.controller');
const authMiddleware = require('../middleware/auth.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { createStudentValidator, updateStudentValidator } = require('../validators/student.validator');
const { param } = require('express-validator');
const validateMiddleware = require('../middleware/validate.middleware');

const router = express.Router();

const uuidParam = [param('id').isUUID().withMessage('Student ID must be a valid UUID')];

router.use(authMiddleware, tenantMiddleware);

router.get('/me', studentController.getMyProfile);

router.post(
  '/',
  roleMiddleware(['admin', 'teacher']),
  createStudentValidator,
  validateMiddleware,
  studentController.createStudent
);

router.get(
  '/',
  roleMiddleware(['admin', 'teacher', 'accountant']),
  studentController.getAllStudents
);

router.get(
  '/:id',
  roleMiddleware(['admin', 'teacher', 'accountant']),
  uuidParam,
  validateMiddleware,
  studentController.getStudent
);

router.put(
  '/:id',
  roleMiddleware(['admin', 'teacher']),
  updateStudentValidator,
  validateMiddleware,
  studentController.updateStudent
);

router.delete(
  '/:id',
  roleMiddleware(['admin']),
  uuidParam,
  validateMiddleware,
  studentController.deleteStudent
);

/**
 * @openapi
 * /api/students:
 *   post:
 *     tags: [Students]
 *     summary: Create a new student
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
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               enrollmentDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Student created
 *
 *   get:
 *     tags: [Students]
 *     summary: List all students
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of students
 *
 * /api/students/{id}:
 *   get:
 *     tags: [Students]
 *     summary: Get a student by ID
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
 *         description: Student details
 *       404:
 *         description: Student not found
 *
 *   put:
 *     tags: [Students]
 *     summary: Update a student
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
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student updated
 *
 *   delete:
 *     tags: [Students]
 *     summary: Delete a student
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
 *         description: Student deleted
 */
module.exports = router;
