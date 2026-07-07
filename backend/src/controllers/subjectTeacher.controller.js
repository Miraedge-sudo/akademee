const response = require('../utils/response');
const subjectTeacherService = require('../services/subjectTeacher.service');

class SubjectTeacherController {
  async assign(req, res, next) {
    try {
      const result = await subjectTeacherService.assign(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Teacher assigned to subject', result, 201);
    } catch (error) {
      if (error.message === 'Assignment already exists') return response.error(res, error.message, null, 409);
      next(error);
    }
  }

  async listBySubject(req, res, next) {
    try {
      const result = await subjectTeacherService.listBySubject(req.schoolId || req.user.schoolId, req.params.subjectId);
      response.success(res, 'Subject teachers retrieved', result);
    } catch (error) { next(error); }
  }

  async listByTeacher(req, res, next) {
    try {
      const result = await subjectTeacherService.listByTeacher(req.schoolId || req.user.schoolId, req.params.teacherId);
      response.success(res, 'Teacher subjects retrieved', result);
    } catch (error) { next(error); }
  }

  async list(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const result = await subjectTeacherService.listBySchool(req.schoolId || req.user.schoolId, { limit, offset });
      response.success(res, 'Subject-teacher assignments retrieved', result);
    } catch (error) { next(error); }
  }

  async remove(req, res, next) {
    try {
      const result = await subjectTeacherService.remove(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Assignment removed', result);
    } catch (error) {
      if (error.message === 'Assignment not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }
}

module.exports = new SubjectTeacherController();
