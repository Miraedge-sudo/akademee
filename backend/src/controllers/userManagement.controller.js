const response = require('../utils/response');
const userManagementService = require('../services/userManagement.service');

class UserManagementController {
  async list(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const { limit, offset, search, role } = req.query;
      const result = await userManagementService.list(schoolId, { limit, offset, search, role });
      response.success(res, 'Users retrieved', result);
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const result = await userManagementService.getById(schoolId, req.params.id);
      response.success(res, 'User retrieved', result);
    } catch (error) {
      if (error.message === 'User not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const result = await userManagementService.create(schoolId, req.body);
      response.success(res, 'User created', result, 201);
    } catch (error) {
      if (error.message.includes('already')) return response.error(res, error.message, null, 409);
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const result = await userManagementService.update(schoolId, req.params.id, req.body);
      response.success(res, 'User updated', result);
    } catch (error) {
      if (error.message === 'User not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const result = await userManagementService.delete(schoolId, req.params.id);
      response.success(res, 'User deactivated', result);
    } catch (error) {
      if (error.message === 'User not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }
}

module.exports = new UserManagementController();
