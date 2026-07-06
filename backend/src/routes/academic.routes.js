/**
 * Academic Routes (Years and Periods)
 */

const express = require('express');
const academicYearController = require('../controllers/academicYear.controller');
const periodController = require('../controllers/period.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const auditMiddleware = require('../middleware/audit.middleware');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

router.post(
  '/years',
  authMiddleware,
  roleMiddleware(['admin']),
  standardLimiter,
  auditMiddleware('CREATE', 'academic_years'),
  academicYearController.createAcademicYear
);

router.get('/years', authMiddleware, academicYearController.getSchoolAcademicYears);

router.get('/years/:id', authMiddleware, academicYearController.getAcademicYear);

router.put(
  '/years/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  auditMiddleware('UPDATE', 'academic_years'),
  academicYearController.updateAcademicYear
);

router.post(
  '/years/:id/activate',
  authMiddleware,
  roleMiddleware(['admin']),
  auditMiddleware('ACTIVATE', 'academic_years'),
  academicYearController.setActiveYear
);

router.post(
  '/years/:id/set-active',
  authMiddleware,
  roleMiddleware(['admin']),
  auditMiddleware('ACTIVATE', 'academic_years'),
  academicYearController.setActiveYear
);

router.delete(
  '/years/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  auditMiddleware('DELETE', 'academic_years'),
  academicYearController.deleteAcademicYear
);

router.post(
  '/terms',
  authMiddleware,
  roleMiddleware(['admin']),
  standardLimiter,
  auditMiddleware('CREATE', 'periods'),
  periodController.create
);

router.get('/terms', authMiddleware, periodController.list);

router.get('/terms/:id', authMiddleware, periodController.getById);

router.put(
  '/terms/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  auditMiddleware('UPDATE', 'periods'),
  periodController.update
);

router.delete(
  '/terms/:id',
  authMiddleware,
  roleMiddleware(['admin']),
  auditMiddleware('DELETE', 'periods'),
  periodController.delete
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
 *
 * /api/academics/years/{id}/set-active:
 *   post:
 *     tags: [Academics]
 *     summary: Set an academic year as active (alias)
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
 *
 * /api/academics/terms:
 *   post:
 *     tags: [Academics]
 *     summary: Create a term/period
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, academicYearId, startDate, endDate]
 *             properties:
 *               name:
 *                 type: string
 *               academicYearId:
 *                 type: string
 *                 format: uuid
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Term created
 *
 *   get:
 *     tags: [Academics]
 *     summary: List all terms
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of terms
 *
 * /api/academics/terms/{id}:
 *   get:
 *     tags: [Academics]
 *     summary: Get a term by ID
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
 *         description: Term details
 *
 *   put:
 *     tags: [Academics]
 *     summary: Update a term
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
 *         description: Term updated
 *
 *   delete:
 *     tags: [Academics]
 *     summary: Delete a term
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
 *         description: Term deleted
 */
module.exports = router;
