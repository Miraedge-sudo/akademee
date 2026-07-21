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

  async listAllGuardians(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit, offset } = req.query;
      const guardians = await guardianService.listBySchool(schoolId, { limit, offset });
      response.success(res, 'Guardians retrieved', guardians);
    } catch (error) {
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

  async getMyChildren(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const userEmail = req.user?.email;
      if (!userEmail) {
        return response.error(res, 'User email not found', null, 400);
      }
      const children = await guardianService.getMyChildren(schoolId, userEmail);
      response.success(res, 'Children retrieved', children);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GuardianController();
