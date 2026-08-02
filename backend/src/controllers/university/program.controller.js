const response = require('../../utils/response');
const programService = require('../../services/university/program.service');

class ProgramController {
  async create(req, res, next) {
    try {
      const result = await programService.create(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Program created', result, 201);
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const result = await programService.getById(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Program retrieved', result);
    } catch (error) {
      if (error.message === 'Program not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const result = await programService.listBySchool(req.schoolId || req.user.schoolId, {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        facultyId: req.query.faculty_id,
        departmentId: req.query.department_id,
        cycle: req.query.cycle,
      });
      response.success(res, 'Programs retrieved', result);
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const result = await programService.update(req.schoolId || req.user.schoolId, req.params.id, req.body);
      response.success(res, 'Program updated', result);
    } catch (error) {
      if (error.message === 'Program not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await programService.delete(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Program deleted', result);
    } catch (error) {
      if (error.message === 'Program not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }
}

module.exports = new ProgramController();
