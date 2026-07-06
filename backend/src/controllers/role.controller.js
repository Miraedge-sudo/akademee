const response = require('../utils/response');
const roleService = require('../services/role.service');

class RoleController {
  async listRoles(req, res, next) {
    try {
      const result = await roleService.listRoles();
      response.success(res, 'Roles retrieved', result);
    } catch (error) { next(error); }
  }

  async getUserRoles(req, res, next) {
    try {
      const result = await roleService.getUserRoles(req.params.userId);
      response.success(res, 'User roles retrieved', result);
    } catch (error) { next(error); }
  }

  async assignRole(req, res, next) {
    try {
      const { roleCode } = req.body;
      const result = await roleService.assignRole(req.params.userId, roleCode);
      response.success(res, 'Role assigned', result, 201);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('already has')) {
        return response.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async removeRole(req, res, next) {
    try {
      const result = await roleService.removeRole(req.params.userId, req.params.roleCode);
      response.success(res, 'Role removed', result);
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('does not have')) {
        return response.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async listPermissions(req, res, next) {
    try {
      const result = await roleService.listPermissions();
      response.success(res, 'Permissions retrieved', result);
    } catch (error) { next(error); }
  }

  async getRolePermissions(req, res, next) {
    try {
      const result = await roleService.getRolePermissions(req.params.roleCode);
      response.success(res, 'Role permissions retrieved', result);
    } catch (error) {
      if (error.message === 'Role not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async assignPermission(req, res, next) {
    try {
      const { permissionCode } = req.body;
      const result = await roleService.assignPermission(req.params.roleCode, permissionCode);
      response.success(res, 'Permission assigned', result, 201);
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async removePermission(req, res, next) {
    try {
      const result = await roleService.removePermission(req.params.roleCode, req.params.permissionCode);
      response.success(res, 'Permission removed', result);
    } catch (error) {
      if (error.message.includes('not found')) return response.error(res, error.message, null, 404);
      next(error);
    }
  }
}

module.exports = new RoleController();
