/**
 * Academic Routes (Years and Periods)
 */

const express = require('express');
const academicYearController = require('../controllers/academicYear.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

router.post(
  '/years',
  authMiddleware,
  roleMiddleware(['admin']),
  academicYearController.createAcademicYear
);

router.get('/years/:id', authMiddleware, academicYearController.getAcademicYear);

router.get('/years', authMiddleware, academicYearController.getSchoolAcademicYears);

router.post('/years/:id/set-active', authMiddleware, roleMiddleware(['admin']), academicYearController.setActiveYear);

router.delete('/years/:id', authMiddleware, roleMiddleware(['admin']), academicYearController.deleteAcademicYear);

module.exports = router;
