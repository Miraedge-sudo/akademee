const response = require('../utils/response');
const enrollmentService = require('../services/enrollment.service');

class EnrollmentController {
  async create(req, res, next) {
    try {
      const result = await enrollmentService.create(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Enrollment created', result, 201);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('already enrolled') || error.message.includes('capacity')) {
        return response.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const result = await enrollmentService.getById(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Enrollment retrieved', result);
    } catch (error) {
      if (error.message === 'Enrollment not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const { classId, status, academicYearId, limit, offset } = req.query;
      const result = await enrollmentService.listBySchool(req.schoolId || req.user.schoolId, { classId, status, academicYearId, limit, offset });
      response.success(res, 'Enrollments retrieved', result);
    } catch (error) { next(error); }
  }

  async listByStudent(req, res, next) {
    try {
      const result = await enrollmentService.listByStudent(req.schoolId || req.user.schoolId, req.params.studentId);
      response.success(res, 'Enrollments retrieved', result);
    } catch (error) { next(error); }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const result = await enrollmentService.updateStatus(req.schoolId || req.user.schoolId, req.params.id, status);
      response.success(res, 'Enrollment status updated', result);
    } catch (error) {
      if (error.message === 'Enrollment not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async transfer(req, res, next) {
    try {
      const { newClassId } = req.body;
      const result = await enrollmentService.transfer(req.schoolId || req.user.schoolId, req.params.id, newClassId);
      response.success(res, 'Enrollment transferred', result);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('capacity')) {
        return response.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await enrollmentService.delete(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Enrollment deleted', result);
    } catch (error) {
      if (error.message === 'Enrollment not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }
}

module.exports = new EnrollmentController();
