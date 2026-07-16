const response = require('../utils/response');
const levelService = require('../services/level.service');

class LevelController {
  async create(req, res, next) {
    try {
      const result = await levelService.create(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Level created', result, 201);
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const result = await levelService.getById(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Level retrieved', result);
    } catch (error) {
      if (error.message === 'Level not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const result = await levelService.listBySchool(req.schoolId || req.user.schoolId);
      response.success(res, 'Levels retrieved', result);
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const result = await levelService.update(req.schoolId || req.user.schoolId, req.params.id, req.body);
      response.success(res, 'Level updated', result);
    } catch (error) {
      if (error.message === 'Level not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await levelService.delete(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Level deleted', result);
    } catch (error) {
      if (error.message === 'Level not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }
}

module.exports = new LevelController();
