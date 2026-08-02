const response = require('../../utils/response');
const publicationService = require('../../services/university/publication.service');

class PublicationController {
  async create(req, res, next) {
    try {
      const result = await publicationService.create(req.schoolId || req.user.schoolId, req.body);
      response.success(res, 'Publication created', result, 201);
    } catch (error) { next(error); }
  }

  async getById(req, res, next) {
    try {
      const result = await publicationService.getById(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Publication retrieved', result);
    } catch (error) {
      if (error.message === 'Publication not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const isPublished = req.query.is_published === undefined
        ? undefined
        : req.query.is_published === 'true';
      const result = await publicationService.listBySchool(req.schoolId || req.user.schoolId, {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        facultyId: req.query.faculty_id,
        departmentId: req.query.department_id,
        type: req.query.type,
        year: req.query.year,
        isPublished,
      });
      response.success(res, 'Publications retrieved', result);
    } catch (error) { next(error); }
  }

  async update(req, res, next) {
    try {
      const result = await publicationService.update(req.schoolId || req.user.schoolId, req.params.id, req.body);
      response.success(res, 'Publication updated', result);
    } catch (error) {
      if (error.message === 'Publication not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await publicationService.delete(req.schoolId || req.user.schoolId, req.params.id);
      response.success(res, 'Publication deleted', result);
    } catch (error) {
      if (error.message === 'Publication not found') return response.error(res, error.message, null, 404);
      next(error);
    }
  }

  async listPublic(req, res, next) {
    try {
      const result = await publicationService.listPublic(req.schoolId || req.user?.schoolId, {
        page: req.query.page,
        limit: req.query.limit,
        search: req.query.search,
        type: req.query.type,
        year: req.query.year,
      });
      response.success(res, 'Public publications retrieved', result);
    } catch (error) { next(error); }
  }
}

module.exports = new PublicationController();
