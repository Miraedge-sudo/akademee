/**
 * Onboarding Validators — validate website setup payload per school.
 */

const { body } = require('express-validator');

const saveOnboardingValidator = [
  body('schoolName').optional().trim().isLength({ max: 200 }),
  body('tagline').optional().trim().isLength({ max: 255 }),
  body('city').optional().trim(),
  body('region').optional().trim(),
  body('address').optional().trim(),
  body('phone').optional().trim(),
  body('email').optional().isEmail().normalizeEmail(),
  body('yearFounded').optional().trim().isLength({ max: 4 }),
  body('primaryColor').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('templateCode').optional().isIn(['bold', 'playful', 'premium']),
  body('websiteDescription').optional().trim().isLength({ max: 2000 }),
  body('websiteStats').optional().isObject(),
  body('websiteValues').optional().isArray({ max: 4 }),
  body('educationalSystems').optional().isArray({ max: 10 }),
  body('educationalSystems.*').optional().isString().isIn([
    'anglophone_general', 'francophone_general',
    'anglophone_technical', 'francophone_technical',
    'university',
  ]),
  body('heroImageUrl2').optional().isString().isLength({ max: 500 }),
  body('examType').optional().trim().isLength({ max: 50 }),
  body('examPassRate').optional().trim().isLength({ max: 10 }),
  body('ranking').optional().trim().isLength({ max: 50 }),
  body('rankingCity').optional().trim().isLength({ max: 100 }),
  body('aboutPhotos').optional().isArray({ max: 20 }),
  body('aboutPhotos.*.url').optional().isString(),
  body('aboutPhotos.*.caption').optional().isString(),
  body('classesConfig').optional().isObject(),
  body('onboardingCompleted').optional().isBoolean(),
  body('websitePublished').optional().isBoolean(),
];

module.exports = {
  saveOnboardingValidator,
};
