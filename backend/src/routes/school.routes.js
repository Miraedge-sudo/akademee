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

/**
 * @openapi
 * /api/schools/register:
 *   post:
 *     tags: [Schools]
 *     summary: Register a new school
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [schoolName, subdomain, email, password]
 *             properties:
 *               schoolName:
 *                 type: string
 *               subdomain:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               language:
 *                 type: string
 *                 enum: [en, fr]
 *     responses:
 *       201:
 *         description: School registered successfully
 *       409:
 *         description: Subdomain already taken
 *
 * /api/schools/check-subdomain:
 *   post:
 *     tags: [Schools]
 *     summary: Check if a subdomain is available
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subdomain]
 *             properties:
 *               subdomain:
 *                 type: string
 *     responses:
 *       200:
 *         description: Subdomain availability status
 *
 * /api/schools/plans:
 *   get:
 *     tags: [Schools]
 *     summary: List available subscription plans
 *     responses:
 *       200:
 *         description: Available plans
 *
 * /api/schools/templates:
 *   get:
 *     tags: [Schools]
 *     summary: List available onboarding templates
 *     responses:
 *       200:
 *         description: Available templates
 *
 * /api/schools/verify-email:
 *   get:
 *     tags: [Schools]
 *     summary: Verify school email address via token
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Verification token
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Invalid token
 *
 * /api/schools/onboarding:
 *   get:
 *     tags: [Schools]
 *     summary: Get onboarding status and data
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Onboarding data
 *
 *   put:
 *     tags: [Schools]
 *     summary: Save onboarding data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schoolName:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               logo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Onboarding data saved
 *
 * /api/schools/onboarding/media:
 *   post:
 *     tags: [Schools]
 *     summary: Upload onboarding media
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Media uploaded
 *
 * /api/schools/resend-verification:
 *   post:
 *     tags: [Schools]
 *     summary: Resend verification email
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification email resent
 *
 * /api/schools:
 *   post:
 *     tags: [Schools]
 *     summary: Create a new school (admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, subdomain]
 *             properties:
 *               name:
 *                 type: string
 *               subdomain:
 *                 type: string
 *     responses:
 *       201:
 *         description: School created
 *
 *   get:
 *     tags: [Schools]
 *     summary: List all schools
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of schools
 *
 * /api/schools/{id}:
 *   get:
 *     tags: [Schools]
 *     summary: Get a school by ID
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
 *         description: School details
 *       404:
 *         description: School not found
 *
 *   put:
 *     tags: [Schools]
 *     summary: Update a school
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
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: School updated
 */
module.exports = router;
