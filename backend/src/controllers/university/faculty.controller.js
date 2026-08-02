const response = require('../../utils/response');
const facultyService = require('../../services/university/faculty.service');

class FacultyController {
  async create(req, res, next) {
    try {
      const result = await facultyService.create(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Faculty created', result, 201);
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const result = await facultyService.getById(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Faculty retrieved', result);
    } catch (error) {
      if (error.message === 'Faculty not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const result = await facultyService.listBySchool(req.schoolId || req.user.schoolId, {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
      });
      response.success(res, 'Faculties retrieved', result);
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const result = await facultyService.update(req.schoolId || req.user.schoolId, req.params.id, req.body);
      response.success(res, 'Faculty updated', result);
    } catch (error) {
      if (error.message === 'Faculty not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await facultyService.delete(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Faculty deleted', result);
    } catch (error) {
      if (error.message === 'Faculty not found') return response.error(res, error.message, null, 404);
      if (error.message.startsWith('Cannot delete faculty')) return response.error(res, error.message, null, 409);
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const result = await facultyService.getStats(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Faculty stats retrieved', result);
    } catch (error) {
      if (error.message === 'Faculty not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async listPrograms(req, res, next) {
    try {
      const result = await facultyService.listProgramsByFaculty(req.schoolId || req.user.schoolId, req.params.id, {
        page: req.query.page,
        limit: req.query.limit,
        cycle: req.query.cycle,
      });
      response.success(res, 'Faculty programs retrieved', result);
    } catch (error) {
      if (error.message === 'Faculty not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }
}

module.exports = new FacultyController();
