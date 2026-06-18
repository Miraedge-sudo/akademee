/**
 * Onboarding Controller — HTTP handlers for per-school website setup (tenant-scoped).
 */

const response = require('../utils/response');
const onboardingService = require('../services/onboarding.service');

class OnboardingController {
  async getOnboarding(req, res, next) {
    try {
      const data = await onboardingService.getOnboardingData(req.schoolId);
      response.success(res, 'Onboarding data retrieved', data);
    } catch (error) {
      if (error.message === 'School not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async saveOnboarding(req, res, next) {
    try {
      const result = await onboardingService.saveOnboarding(req.schoolId, req.body);
      response.success(res, 'Onboarding saved', result);
    } catch (error) {
      if (error.message === 'School not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async uploadMedia(req, res, next) {
    try {
      if (!req.file) {
        return response.error(res, 'No file uploaded', null, 400);
      }

      const mediaType = req.body.mediaType || req.query.mediaType;
      const sortOrder = req.body.sortOrder !== undefined ? parseInt(req.body.sortOrder, 10) : null;
      const saved = await onboardingService.uploadMedia(req.schoolId, req.file, mediaType, sortOrder);
      response.success(res, 'Media uploaded', saved, 201);
    } catch (error) {
      if (error.message === 'Invalid media type' || error.message.includes('Cloudinary')) {
        return response.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.query;
      if (!token) {
        return response.error(res, 'Verification token is required', null, 400);
      }

      const result = await onboardingService.verifySchoolEmail(token);
      response.success(res, result.alreadyVerified ? 'Email already verified' : 'Email verified successfully', result);
    } catch (error) {
      return response.error(res, error.message, null, 400);
    }
  }

  async resendVerification(req, res, next) {
    try {
      const schoolService = require('../services/school.service');
      const result = await schoolService.resendVerificationEmail(req.schoolId);
      response.success(res, 'Verification email sent', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OnboardingController();
