const response = require('../../utils/response');
const researchProjectService = require('../../services/university/researchProject.service');

class ResearchProjectController {
  async create(req, res, next) {
    try {
      const result = await researchProjectService.create(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Research project created', result, 201);
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const result = await researchProjectService.getById(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Research project retrieved', result);
    } catch (error) {
      if (error.message === 'Research project not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const isPublished = req.query.is_published === undefined
        ? undefined
        : req.query.is_published === 'true';
      const result = await researchProjectService.listBySchool(req.schoolId || req.user.schoolId, {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        facultyId: req.query.faculty_id,
        departmentId: req.query.department_id,
        status: req.query.status,
        isPublished,
      });
      response.success(res, 'Research projects retrieved', result);
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const result = await researchProjectService.update(req.schoolId || req.user.schoolId, req.params.id, req.body);
      response.success(res, 'Research project updated', result);
    } catch (error) {
      if (error.message === 'Research project not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await researchProjectService.delete(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Research project deleted', result);
    } catch (error) {
      if (error.message === 'Research project not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async listPublic(req, res, next) {
    try {
      const result = await researchProjectService.listPublic(req.schoolId || req.user?.schoolId, {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        status: req.query.status,
      });
      response.success(res, 'Public research projects retrieved', result);
    } catch (error) { next(error); }
  }
}

module.exports = new ResearchProjectController();
