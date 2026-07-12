/**
 * Academic Routes (Years and Periods)
 */

const express = require('express');
const academicYearController = require('../controllers/academicYear.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const validateMiddleware = require('../middleware/validate.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');
const {
  createAcademicYearValidator,
  updateAcademicYearValidator,
  yearIdParamValidator,
} = require('../validators/academicYear.validator');

const router = express.Router();

router.post(
  '/years',
  authMiddleware,
  roleMiddleware(['admin']),
  createAcademicYearValidator,
  validateMiddleware,
  standardLimiter,
  auditMiddleware('CREATE', 'academic_years'),
  academicYearController.createAcademicYear
);

router.get('/years', authMiddleware, academicYearController.getSchoolAcademicYears);

router.get('/years/:id', authMiddleware, yearIdParamValidator, validateMiddleware, academicYearController.getAcademicYear);

router.put(
  '/years/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  updateAcademicYearValidator,
  validateMiddleware,
  auditMiddleware('UPDATE', 'academic_years'),
  academicYearController.updateAcademicYear
);

router.post(
  '/years/:id/activate',
  authMiddleware,
  roleMiddleware(['admin']),
  yearIdParamValidator,
  validateMiddleware,
  auditMiddleware('ACTIVATE', 'academic_years'),
  academicYearController.setActiveYear
);

router.delete(
  '/years/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  yearIdParamValidator,
  validateMiddleware,
  auditMiddleware('DELETE', 'academic_years'),
  academicYearController.deleteAcademicYear
);

/**
 * @openapi
 * /api/academics/years:
 *   post:
 *     tags: [Academics]
 *     summary: Create an academic year
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, startDate, endDate]
 *             properties:
 *               name:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Academic year created
 *
 *   get:
 *     tags: [Academics]
 *     summary: List academic years for the school
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of academic years
 *
 * /api/academics/years/{id}:
 *   get:
 *     tags: [Academics]
 *     summary: Get an academic year by ID
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
 *         description: Academic year details
 *
 *   put:
 *     tags: [Academics]
 *     summary: Update an academic year
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
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Academic year updated
 *
 *   delete:
 *     tags: [Academics]
 *     summary: Delete an academic year
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
 *         description: Academic year deleted
 *
 * /api/academics/years/{id}/activate:
 *   post:
 *     tags: [Academics]
 *     summary: Set an academic year as active
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
 *         description: Academic year activated
 */
module.exports = router;
