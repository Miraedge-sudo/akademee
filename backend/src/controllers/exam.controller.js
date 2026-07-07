const response = require('../utils/response');
const examService = require('../services/exam.service');

class ExamController {
  async create(req, res, next) {
    try {
      const result = await examService.create(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Exam created', result, 201);
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const result = await examService.getById(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Exam retrieved', result);
    } catch (error) {
      if (error.message === 'Exam not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const result = await examService.listBySchool(req.schoolId || req.user.schoolId, { limit, offset });
      response.success(res, 'Exams retrieved', result);
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const result = await examService.update(req.schoolId || req.user.schoolId, req.params.id, req.body);
      response.success(res, 'Exam updated', result);
    } catch (error) {
      if (error.message === 'Exam not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await examService.delete(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Exam deleted', result);
    } catch (error) {
      if (error.message === 'Exam not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async registerStudent(req, res, next) {
    try {
      const result = await examService.registerStudent(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Student registered for exam', result, 201);
    } catch (error) {
      if (error.message.includes('already registered')) return response.error(res, error.message, null, 409);
      next(error);
    }
  }

  async listRegistrations(req, res, next) {
    try {
      const result = await examService.listRegistrations(req.schoolId || req.user.schoolId, req.params.examId);
      response.success(res, 'Exam registrations retrieved', result);
    } catch (error) { next(error); }
  }

  async recordResult(req, res, next) {
    try {
      const result = await examService.recordResult(req.schoolId || req.user.schoolId, req.params.id, req.body);
      response.success(res, 'Exam result recorded', result);
    } catch (error) {
      if (error.message === 'Registration not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }
}

module.exports = new ExamController();
