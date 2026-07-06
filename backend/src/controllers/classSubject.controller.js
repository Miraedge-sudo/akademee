const response = require('../utils/response');
const classSubjectService = require('../services/classSubject.service');

class ClassSubjectController {
  async assign(req, res, next) {
    try {
      const result = await classSubjectService.assign(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Subject assigned to class', result, 201);
    } catch (error) { next(error); }
  }

  async listByClass(req, res, next) {
    try {
      const result = await classSubjectService.listByClass(req.schoolId || req.user.schoolId, req.params.classId);
      response.success(res, 'Class subjects retrieved', result);
    } catch (error) { next(error); }
  }

  async list(req, res, next) {
    try {
      const { limit, offset } = req.query;
      const result = await classSubjectService.listBySchool(req.schoolId || req.user.schoolId, { limit, offset });
      response.success(res, 'Class-subject assignments retrieved', result);
    } catch (error) { next(error); }
  }

  async remove(req, res, next) {
    try {
      const result = await classSubjectService.remove(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Assignment removed', result);
    } catch (error) {
      if (error.message === 'Assignment not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async bulkAssign(req, res, next) {
    try {
      const { classId, subjectIds } = req.body;
      const result = await classSubjectService.bulkAssign(req.schoolId || req.user.schoolId, classId, subjectIds);
      response.success(res, 'Subjects assigned to class', result, 201);
    } catch (error) { next(error); }
  }
}

module.exports = new ClassSubjectController();
