/**
 * Report Card Jobs Routes
 *
 * Routes for the background report card generation job system.
 * Mounted at /api/v1/report-card-jobs
 */

const express = require('express');
const reportCardJobsController = require('../controllers/reportCardJobs.controller');
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

// ── Create a new batch generation job ──
// Matches the original batch route: admin AND teacher can trigger generation
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  reportCardJobsController.createJob
);

// ── List jobs ──
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  reportCardJobsController.listJobs
);

// ── Get job status ──
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  reportCardJobsController.getJobStatus
);

// ── Cancel a job ──
router.post(
  '/:id/cancel',
  authMiddleware,
  roleMiddleware(['admin']),
  reportCardJobsController.cancelJob
);

// ── SSE stream for real-time job progress ──
router.get(
  '/:id/progress',
  authMiddleware,
  roleMiddleware(['admin', 'teacher']),
  reportCardJobsController.streamJobProgress
);

module.exports = router;