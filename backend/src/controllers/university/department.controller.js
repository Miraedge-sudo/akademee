const response = require('../../utils/response');
const departmentService = require('../../services/university/department.service');

class DepartmentController {
  async create(req, res, next) {
    try {
      const result = await departmentService.create(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Department created', result, 201);
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const result = await departmentService.getById(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Department retrieved', result);
    } catch (error) {
      if (error.message === 'Department not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const result = await departmentService.listBySchool(req.schoolId || req.user.schoolId, {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        facultyId: req.query.faculty_id,
      });
      response.success(res, 'Departments retrieved', result);
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const result = await departmentService.update(req.schoolId || req.user.schoolId, req.params.id, req.body);
      response.success(res, 'Department updated', result);
    } catch (error) {
      if (error.message === 'Department not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await departmentService.delete(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Department deleted', result);
    } catch (error) {
      if (error.message === 'Department not found') return response.error(res, error.message, null, 404);
      if (error.message.startsWith('Cannot delete department')) return response.error(res, error.message, null, 409);
      next(error);
    }
  }
}

module.exports = new DepartmentController();
