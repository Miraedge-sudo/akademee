/**
 * Guardian Controller — tenant-scoped guardian management per school.
 */

const response = require('../utils/response');
const guardianService = require('../services/guardian.service');

class GuardianController {
  async createGuardian(req, res, next) {
    try {
      const guardian = await guardianService.createGuardian(req.schoolId, req.body);
      response.success(res, 'Guardian created', guardian, 201);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('required')) {
        return response.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async getGuardian(req, res, next) {
    try {
      const guardian = await guardianService.getGuardianById(req.schoolId, req.params.id);
      response.success(res, 'Guardian retrieved', guardian);
    } catch (error) {
      if (error.message === 'Guardian not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async getStudentGuardians(req, res, next) {
    try {
      const guardians = await guardianService.listByStudent(req.schoolId, req.params.studentId);
      response.success(res, 'Guardians retrieved', guardians);
    } catch (error) {
      if (error.message.includes('not found')) {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async updateGuardian(req, res, next) {
    try {
      const guardian = await guardianService.updateGuardian(req.schoolId, req.params.id, req.body);
      response.success(res, 'Guardian updated', guardian);
    } catch (error) {
      if (error.message === 'Guardian not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async deleteGuardian(req, res, next) {
    try {
      const result = await guardianService.deleteGuardian(req.schoolId, req.params.id);
      response.success(res, 'Guardian deleted', result);
    } catch (error) {
      if (error.message === 'Guardian not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }
}

module.exports = new GuardianController();
