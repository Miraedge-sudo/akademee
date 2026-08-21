/**
 * School Controller
 */

const response = require('../utils/response');
const schoolService = require('../services/school.service');

class SchoolController {
  async createSchool(req, res, next) {
    try {
      const { name, email, phone, location, city, country } = req.body;

      const school = await schoolService.createSchool({
        name,
        email,
        phone,
        location,
        city,
        country,
      });

      response.success(res, 'School created successfully', school, 201);
    } catch (error) {
      next(error);
    }
  }

  async getSchool(req, res, next) {
    try {
      const { id } = req.params;

      if (id !== req.schoolId) {
        return response.error(res, 'Access denied.', null, 403);
      }

      const school = await schoolService.getSchool(id);

      response.success(res, 'School retrieved successfully', school);
    } catch (error) {
      next(error);
    }
  }

  async updateSchool(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (id !== req.schoolId) {
        return response.error(res, 'Access denied.', null, 403);
      }

      const school = await schoolService.updateSchool(id, updateData);

      response.success(res, 'School updated successfully', school);
    } catch (error) {
      next(error);
    }
  }

  /** Every ADMIN role in this system is school-scoped — there is no platform-wide
   * admin — so "all schools" for a caller is just their own school. */
  async getAllSchools(req, res, next) {
    try {
      if (!req.schoolId) {
        return response.error(res, 'School not found', null, 400);
      }

      const school = await schoolService.getSchool(req.schoolId);

      response.success(res, 'Schools retrieved successfully', [school]);
    } catch (error) {
      next(error);
    }
  }

  async registerSchool(req, res, next) {
    try {
      const result = await schoolService.registerSchool(req.body);

      if (result.token) {
        const { token, refreshToken } = result;
        const jwtConfig = require('../config/jwt');
        const ACCESS_COOKIE_OPTIONS = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: jwtConfig.accessCookieMaxAgeMs };
        const REFRESH_COOKIE_OPTIONS = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: jwtConfig.refreshCookieMaxAgeMs };
        res.cookie('access_token', token, ACCESS_COOKIE_OPTIONS);
        if (refreshToken) res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
      }

      response.success(res, 'School registered successfully', result, 201);
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('already registered') || error.message.includes('already in use')) {
        return response.error(res, error.message, null, 409);
      }
      next(error);
    }
  }

  async checkSubdomain(req, res, next) {
    try {
      const { subdomain } = req.body;

      const result = await schoolService.checkSubdomain(subdomain);

      response.success(res, 'Subdomain availability checked', result);
    } catch (error) {
      next(error);
    }
  }

  async checkEmail(req, res, next) {
    try {
      const { email } = req.body;

      const result = await schoolService.checkEmail(email);

      response.success(res, 'Email availability checked', result);
    } catch (error) {
      next(error);
    }
  }

  async getPlans(req, res, next) {
    try {
      const plans = await schoolService.getPlans();
      response.success(res, 'Plans retrieved successfully', plans);
    } catch (error) {
      next(error);
    }
  }

  async getTemplates(req, res, next) {
    try {
      const result = await schoolService.getTemplates();

      response.success(res, 'Templates retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async resendVerificationRequest(req, res, next) {
    try {
      const { subdomain } = req.body;
      const result = await schoolService.resendVerificationBySubdomain(subdomain);
      response.success(res, 'If a matching school exists, verification emails have been sent.', result);
    } catch (error) {
      next(error);
    }
  }

  /** Resend SMTP verification email for the authenticated school */
  async resendVerification(req, res, next) {
    try {
      const result = await schoolService.resendVerificationEmail(req.schoolId);
      response.success(res, 'Verification email processed', result);
    } catch (error) {
      next(error);
    }
  }

  /** Upgrade school subscription plan */
  async upgradePlan(req, res, next) {
    try {
      const { planCode } = req.body;
      const schoolId = req.user?.schoolId || req.schoolId;
      if (!schoolId) {
        return response.error(res, 'School not found', null, 400);
      }
      if (!planCode) {
        return response.error(res, 'Plan code is required', null, 400);
      }
      const result = await schoolService.upgradePlan(schoolId, planCode);
      response.success(res, 'Plan upgraded successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /** Check trial status for the authenticated school */
  async checkTrialStatus(req, res, next) {
    try {
      const schoolId = req.user?.schoolId || req.schoolId;
      if (!schoolId) {
        return response.error(res, 'School not found', null, 400);
      }
      const sql = require('../config/database');
      const schools = await sql`
        SELECT subscription_plan, subscription_status, subscription_start_date, subscription_end_date
        FROM schools WHERE school_id = ${schoolId}
      `;
      if (schools.length === 0) {
        return response.error(res, 'School not found', null, 404);
      }
      const school = schools[0];
      let trialInfo = null;
      if (school.subscription_status === 'trial' && school.subscription_end_date) {
        const endDate = new Date(school.subscription_end_date);
        const now = new Date();
        const diffMs = endDate.getTime() - now.getTime();
        const remainingDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        trialInfo = {
          plan: school.subscription_plan,
          status: school.subscription_status,
          startDate: school.subscription_start_date,
          endDate: school.subscription_end_date,
          remainingDays,
          expired: remainingDays <= 0,
        };
      }
      response.success(res, 'Trial status retrieved', {
        plan: school.subscription_plan,
        status: school.subscription_status,
        trialInfo,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SchoolController();
