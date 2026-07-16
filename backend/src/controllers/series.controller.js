const response = require('../utils/response');
const seriesService = require('../services/series.service');

class SeriesController {
  async create(req, res, next) {
    try {
      const result = await seriesService.create(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Series created', result, 201);
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const result = await seriesService.getById(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Series retrieved', result);
    } catch (error) {
      if (error.message === 'Series not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const result = await seriesService.listBySchool(req.schoolId || req.user.schoolId);
      response.success(res, 'Series retrieved', result);
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const result = await seriesService.update(req.schoolId || req.user.schoolId, req.params.id, req.body);
      response.success(res, 'Series updated', result);
    } catch (error) {
      if (error.message === 'Series not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await seriesService.delete(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Series deleted', result);
    } catch (error) {
      if (error.message === 'Series not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }
}

module.exports = new SeriesController();
