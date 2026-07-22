/**
 * Grading System v1 Routes
 *
 * Implements the backend API endpoints described in the Report Card
 * Grading System technical specification (spec §9).
 */

const express = require('express');
const gradingController = require('../../controllers/grading.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const roleMiddleware = require('../../middleware/role.middleware');

const router = express.Router();

// ------------------------------------------------------------------
// 9.1 Education Systems
// ------------------------------------------------------------------
router.get('/education-systems', authMiddleware, gradingController.listEducationSystems);
router.get('/education-systems/:id', authMiddleware, gradingController.getEducationSystem);

// ------------------------------------------------------------------
// 9.2 Grading Scales & Versions
// ------------------------------------------------------------------
router.post('/grading-scales', authMiddleware, roleMiddleware(['admin']), gradingController.createGradingScale);
router.get('/grading-scales', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.listGradingScales);
router.post('/grading-scales/:scaleId/versions', authMiddleware, roleMiddleware(['admin']), gradingController.createGradingScaleVersion);
router.get('/grading-scales/:scaleId/versions', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.listGradingScaleVersions);

// ------------------------------------------------------------------
// 9.3 Mention Thresholds
// ------------------------------------------------------------------
router.post('/mention-threshold-sets', authMiddleware, roleMiddleware(['admin']), gradingController.createMentionThresholdSet);
router.post('/mention-threshold-sets/:setId/thresholds', authMiddleware, roleMiddleware(['admin']), gradingController.createMentionThreshold);
router.get('/mention-threshold-sets/:setId/thresholds', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.listMentionThresholds);

// ------------------------------------------------------------------
// 9.4 Report Card Configuration
// ------------------------------------------------------------------
router.get('/report-card-configs/:appliesTo', authMiddleware, roleMiddleware(['admin']), gradingController.getReportCardConfig);
router.put('/report-card-configs/:appliesTo', authMiddleware, roleMiddleware(['admin']), gradingController.upsertReportCardConfig);

// ------------------------------------------------------------------
// 9.5 Subject Offerings
// ------------------------------------------------------------------
router.post('/subject-offerings', authMiddleware, roleMiddleware(['admin']), gradingController.createSubjectOffering);
router.get('/subject-offerings', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.listSubjectOfferings);

// ------------------------------------------------------------------
// 9.6 Assessment Components
// ------------------------------------------------------------------
router.post('/assessment-components', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.createAssessmentComponent);
router.get('/subject-offerings/:offeringId/assessment-components', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.listAssessmentComponents);

// ------------------------------------------------------------------
// 9.7 UE Groups
// ------------------------------------------------------------------
router.post('/ue-groups', authMiddleware, roleMiddleware(['admin']), gradingController.createUEGroup);
router.get('/ue-groups', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.listUEGroups);

// ------------------------------------------------------------------
// 9.8 Grades
// ------------------------------------------------------------------
router.post('/grades', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.createGrade);
router.get('/grades', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.listGrades);
router.put('/grades/:id', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.updateGrade);

// ------------------------------------------------------------------
// 9.9 Calculations
// ------------------------------------------------------------------
router.get('/calculations/subject-average', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.calculateSubjectAverage);
router.get('/calculations/period-average', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.calculatePeriodAverage);
router.get('/calculations/cohort-ranks', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.calculateCohortRanks);

// ------------------------------------------------------------------
// 9.10 Report Cards
// ------------------------------------------------------------------
router.post('/report-cards', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.generateReportCard);
router.post('/report-cards/batch', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.generateBatchReportCards);
router.get('/report-cards', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.listReportCards);
router.get('/report-cards/:id/payload', authMiddleware, roleMiddleware(['admin', 'teacher']), gradingController.getReportCardPayload);
router.post('/report-cards/:id/publish', authMiddleware, roleMiddleware(['admin']), gradingController.publishReportCard);
router.post('/report-cards/:id/revise', authMiddleware, roleMiddleware(['admin']), gradingController.reviseReportCard);
router.post('/report-cards/:id/lock', authMiddleware, roleMiddleware(['admin']), gradingController.lockReportCard);

module.exports = router;
