const response = require('../utils/response');
const academicYearService = require('../services/academicYear.service');

class AcademicYearController {
  async createAcademicYear(req, res, next) {
    try {
      const { year, startDate, endDate, name, academicSystem } = req.body;
      const { schoolId } = req;
      const result = await academicYearService.create(schoolId, { year, startDate, endDate, name, academicSystem });
      response.success(res, 'Academic year created', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAcademicYear(req, res, next) {
    try {
      const { id } = req.params;
      const result = await academicYearService.getById(req.schoolId || req.user.schoolId, id);
      response.success(res, 'Academic year retrieved', result);
    } catch (error) {
      if (error.message === 'Academic year not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async getSchoolAcademicYears(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit, offset } = req.query;
      const result = await academicYearService.listBySchool(schoolId, { limit, offset });
      response.success(res, 'Academic years retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async setActiveYear(req, res, next) {
    try {
      const { id } = req.params;
      const result = await academicYearService.setActive(req.schoolId || req.user.schoolId, id);
      response.success(res, 'Academic year set as active', result);
    } catch (error) {
      if (error.message === 'Academic year not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async updateAcademicYear(req, res, next) {
    try {
      const { id } = req.params;
      const { year, startDate, endDate, name } = req.body;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await academicYearService.update(schoolId, id, { year, startDate, endDate, name });
      response.success(res, 'Academic year updated', result);
    } catch (error) {
      if (error.message === 'Academic year not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async deleteAcademicYear(req, res, next) {
    try {
      const { id } = req.params;
      const result = await academicYearService.delete(req.schoolId || req.user.schoolId, id);
      response.success(res, 'Academic year deleted', result);
    } catch (error) {
      if (error.message === 'Academic year not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }
}

module.exports = new AcademicYearController();
