/**
 * Enrolment Routes — public enrolment form submissions from website templates
 */

const express = require('express');
const enrolmentController = require('../controllers/enrolment.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { standardLimiter } = require('../middleware/rateLimiter.middleware');

const router = express.Router();

// Public endpoint — no auth required, just rate limiting
router.post('/enrol', standardLimiter, enrolmentController.submitInquiry);

// Authenticated endpoints — for managing inquiries
router.get('/inquiries', authMiddleware, enrolmentController.listInquiries);
router.put('/inquiries/:id/status', authMiddleware, enrolmentController.updateStatus);

module.exports = router;
