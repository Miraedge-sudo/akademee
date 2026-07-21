/**
 * Onboarding Controller — HTTP handlers for per-school website setup (tenant-scoped).
 */

const response = require('../utils/response');
const sql = require('../config/database');
const onboardingService = require('../services/onboarding.service');
const authService = require('../services/auth.service');

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
      if (error.message === 'School email is not verified') {
        return response.error(res, 'Please verify your school email before starting onboarding.', null, 403);
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

      // Create an auth session so the user can proceed directly to onboarding
      let session = null;
      if (result.schoolId) {
        try {
          const schoolData = await sql`
            SELECT s.school_id, s.name, s.subdomain, s.website_template_id, s.email_verified, s.require_email_verification, s.onboarding_completed, wt.template_code
            FROM schools s
            LEFT JOIN website_templates wt ON s.website_template_id = wt.template_id
            WHERE s.school_id = ${result.schoolId}
          `;
          const school = schoolData[0];

          const users = await sql`
            SELECT u.user_id, u.school_id, u.first_name, u.last_name, u.email, u.login_email, u.is_active, u.phone, u.email_verified, u.require_email_verification
            FROM users u
            WHERE u.school_id = ${result.schoolId}
            ORDER BY u.user_id
            LIMIT 1
          `;
          const user = users[0];

          if (school && user) {
            const roles = await sql`
              SELECT r.role_code
              FROM user_roles ur
              INNER JOIN roles r ON r.role_id = ur.role_id
              WHERE ur.user_id = ${user.user_id}
            `;
            console.log('[OnboardingController] Creating auth session for user', user.user_id, 'roles:', roles.map(r => r.role_code));
            session = await authService.createAuthSession(user, school, roles);
            console.log('[OnboardingController] Auth session created:', !!session, 'token length:', session?.token?.length);
          } else {
            console.warn('[OnboardingController] Could not create auth session; school:', !!school, 'user:', !!user);
          }
        } catch (sessionError) {
          console.error('[OnboardingController] Failed to create auth session after verification:', sessionError.message);
        }
      }

      response.success(res, result.alreadyVerified ? 'Email already verified' : 'Email verified successfully', { ...result, session });
    } catch (error) {
      return response.error(res, error.message, null, 400);
    }
  }

}

module.exports = new OnboardingController();
