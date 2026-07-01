/**
 * School Routes — registration, verification, onboarding, and school management.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const schoolController = require('../controllers/school.controller');
const onboardingController = require('../controllers/onboarding.controller');
const authMiddleware = require('../middleware/auth.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const uploadMiddleware = require('../middleware/upload.middleware');
const {
  createSchoolValidator,
  updateSchoolValidator,
  registerSchoolValidator,
  checkSubdomainValidator,
  getSchoolValidator,
} = require('../validators/school.validator');
const { saveOnboardingValidator } = require('../validators/onboarding.validator');
const validateMiddleware = require('../middleware/validate.middleware');

const router = express.Router();

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many registration attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Public routes ──

router.post(
  '/register',
  registerLimiter,
  registerSchoolValidator,
  validateMiddleware,
  schoolController.registerSchool
);

router.post(
  '/check-subdomain',
  checkSubdomainValidator,
  validateMiddleware,
  schoolController.checkSubdomain
);

router.get('/plans', schoolController.getPlans);
router.get('/templates', schoolController.getTemplates);

/** Verify school email via token link (sent over SMTP after registration) */
router.get('/verify-email', onboardingController.verifyEmail);

// ── Protected onboarding routes (tenant-scoped by JWT schoolId) ──

router.get(
  '/onboarding',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  onboardingController.getOnboarding
);

router.put(
  '/onboarding',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  saveOnboardingValidator,
  validateMiddleware,
  onboardingController.saveOnboarding
);

router.post(
  '/onboarding/media',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  uploadMiddleware,
  onboardingController.uploadMedia
);

router.post(
  '/resend-verification',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  schoolController.resendVerification
);

// ── Protected school admin routes ──

router.post(
  '/',
  authMiddleware,
  createSchoolValidator,
  validateMiddleware,
  schoolController.createSchool
);

router.get('/', authMiddleware, schoolController.getAllSchools);

router.get('/:id', authMiddleware, getSchoolValidator, validateMiddleware, schoolController.getSchool);

router.put(
  '/:id',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  updateSchoolValidator,
  validateMiddleware,
  schoolController.updateSchool
);

module.exports = router;
