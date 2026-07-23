const response = require('../utils/response');
const sequenceService = require('../services/sequence.service');

class SequenceController {
  async create(req, res, next) {
    try {
      const result = await sequenceService.create(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Sequence created', result, 201);
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const result = await sequenceService.getById(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Sequence retrieved', result);
    } catch (error) {
      if (error.message === 'Sequence not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async listBySchool(req, res, next) {
    try {
      const result = await sequenceService.listBySchool(req.schoolId || req.user.schoolId);
      response.success(res, 'Sequences retrieved', result);
    } catch (error) { next(error); }
  }

  async listByPeriode(req, res, next) {
    try {
      const result = await sequenceService.listByPeriode(req.schoolId || req.user.schoolId, req.params.periodeId);
      response.success(res, 'Sequences retrieved', result);
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const result = await sequenceService.update(req.schoolId || req.user.schoolId, req.params.id, req.body);
      response.success(res, 'Sequence updated', result);
    } catch (error) {
      if (error.message === 'Sequence not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await sequenceService.delete(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Sequence deleted', result);
    } catch (error) {
      if (error.message === 'Sequence not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async open(req, res, next) {
    try {
      const result = await sequenceService.updateStatus(req.schoolId || req.user.schoolId, req.params.id, 'OUVERTE');
      response.success(res, 'Sequence opened', result);
    } catch (error) {
      if (error.message === 'Sequence not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async close(req, res, next) {
    try {
      const result = await sequenceService.updateStatus(req.schoolId || req.user.schoolId, req.params.id, 'FERMEE');
      response.success(res, 'Sequence closed', result);
    } catch (error) {
      if (error.message === 'Sequence not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async lock(req, res, next) {
    try {
      const result = await sequenceService.updateStatus(req.schoolId || req.user.schoolId, req.params.id, 'VERROUILLEE');
      response.success(res, 'Sequence locked', result);
    } catch (error) {
      if (error.message === 'Sequence not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async unlock(req, res, next) {
    try {
      const result = await sequenceService.updateStatus(req.schoolId || req.user.schoolId, req.params.id, 'OUVERTE');
      response.success(res, 'Sequence unlocked', result);
    } catch (error) {
      if (error.message === 'Sequence not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }
}

module.exports = new SequenceController();
