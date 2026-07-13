/**
 * Enrolment Controller — public endpoint accessible without auth for website visitors.
 */

const response = require('../utils/response');
const enrolmentService = require('../services/enrolment.service');

class EnrolmentController {
  /**
   * Public enrolment form submission (no auth required).
   * The schoolId is resolved via subdomain from the request.
   */
  async submitInquiry(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;

      if (!schoolId) {
        return response.error(res, 'School not identified. Please access via your school subdomain.', null, 400);
      }

      const { parentName, parentEmail, parentPhone, studentName, studentAge, grade, message } = req.body;

      // Basic validation
      if (!parentName || !parentName.trim()) {
        return response.error(res, 'Parent name is required', null, 400);
      }
      if (!parentEmail || !parentEmail.trim()) {
        return response.error(res, 'Parent email is required', null, 400);
      }
      if (!studentName || !studentName.trim()) {
        return response.error(res, 'Student name is required', null, 400);
      }

      // Basic email format check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(parentEmail)) {
        return response.error(res, 'Please provide a valid email address', null, 400);
      }

      const result = await enrolmentService.submit(schoolId, {
        parentName: parentName.trim(),
        parentEmail: parentEmail.trim().toLowerCase(),
        parentPhone: parentPhone?.trim() || null,
        studentName: studentName.trim(),
        studentAge: studentAge?.trim() || null,
        grade: grade?.trim() || null,
        message: message?.trim() || null,
      });

      response.success(res, 'Enrolment inquiry submitted successfully. We will contact you soon.', result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * List inquiries (requires auth).
   */
  async listInquiries(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { status, limit, offset } = req.query;

      if (!schoolId) {
        return response.error(res, 'Authentication required', null, 401);
      }

      const result = await enrolmentService.listBySchool(schoolId, { status, limit, offset });
      response.success(res, 'Inquiries retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update inquiry status (requires auth).
   */
  async updateStatus(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { id } = req.params;
      const { status } = req.body;

      if (!schoolId) {
        return response.error(res, 'Authentication required', null, 401);
      }

      const result = await enrolmentService.updateStatus(schoolId, id, status);
      response.success(res, 'Inquiry status updated', result);
    } catch (error) {
      if (error.message.includes('Invalid status') || error.message.includes('not found')) {
        return response.error(res, error.message, null, 400);
      }
      next(error);
    }
  }
}

module.exports = new EnrolmentController();
