const response = require('../utils/response');
const periodService = require('../services/period.service');

class PeriodController {
  async create(req, res, next) {
    try {
      const result = await periodService.create(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Period created', result, 201);
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const result = await periodService.getById(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Period retrieved', result);
    } catch (error) {
      if (error.message === 'Period not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const { academicYearId, limit, offset } = req.query;
      const result = await periodService.listBySchool(req.schoolId || req.user.schoolId, { academicYearId, limit, offset });
      response.success(res, 'Periods retrieved', result);
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const result = await periodService.update(req.schoolId || req.user.schoolId, req.params.id, req.body);
      response.success(res, 'Period updated', result);
    } catch (error) {
      if (error.message === 'Period not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await periodService.delete(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Period deleted', result);
    } catch (error) {
      if (error.message === 'Period not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }
}

module.exports = new PeriodController();
