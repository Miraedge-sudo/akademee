const response = require('../utils/response');
const subjectService = require('../services/subject.service');

class SubjectController {
  async createSubject(req, res, next) {
    try {
      const { name, code, coefficient } = req.body;
      const { schoolId } = req;
      const result = await subjectService.create(schoolId, { name, code, coefficient });
      response.success(res, 'Subject created', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getSubject(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await subjectService.getById(schoolId, id);
      response.success(res, 'Subject retrieved', result);
    } catch (error) {
      if (error.message === 'Subject not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async getClassSubjects(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit, offset } = req.query;
      const result = await subjectService.listBySchool(schoolId, { limit, offset });
      response.success(res, 'Subjects retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getAllSubjects(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit, offset } = req.query;
      const result = await subjectService.listBySchool(schoolId, { limit, offset });
      response.success(res, 'Subjects retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async updateSubject(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await subjectService.update(schoolId, id, updateData);
      response.success(res, 'Subject updated', result);
    } catch (error) {
      if (error.message === 'Subject not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async deleteSubject(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await subjectService.delete(schoolId, id);
      response.success(res, 'Subject deleted', result);
    } catch (error) {
      if (error.message === 'Subject not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }
}

module.exports = new SubjectController();
