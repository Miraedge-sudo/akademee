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

      const school = await schoolService.updateSchool(id, updateData);

      response.success(res, 'School updated successfully', school);
    } catch (error) {
      next(error);
    }
  }

  async getAllSchools(req, res, next) {
    try {
      const { limit = 10, offset = 0 } = req.query;

      const schools = await schoolService.getAllSchools(parseInt(limit), parseInt(offset));

      response.success(res, 'Schools retrieved successfully', schools);
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

  /** Resend SMTP verification email for the authenticated school */
  async resendVerification(req, res, next) {
    try {
      const result = await schoolService.resendVerificationEmail(req.schoolId);
      response.success(res, 'Verification email processed', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SchoolController();
