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
  body('templateCode').optional().isIn(['modern', 'classic', 'minimal']),
  body('websiteDescription').optional().trim().isLength({ max: 2000 }),
  body('websiteStats').optional().isObject(),
  body('websiteValues').optional().isArray({ max: 4 }),
  body('onboardingCompleted').optional().isBoolean(),
  body('websitePublished').optional().isBoolean(),
];

module.exports = {
  saveOnboardingValidator,
};
