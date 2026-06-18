/**
 * Academic Year Controller
 */

const response = require('../utils/response');

class AcademicYearController {
  async createAcademicYear(req, res, next) {
    try {
      const { year, startDate, endDate } = req.body;
      const { schoolId } = req;

      response.success(res, 'Academic year created', {}, 201);
    } catch (error) {
      next(error);
    }
  }

  async getAcademicYear(req, res, next) {
    try {
      const { id } = req.params;

      response.success(res, 'Academic year retrieved', {});
    } catch (error) {
      next(error);
    }
  }

  async getSchoolAcademicYears(req, res, next) {
    try {
      const { schoolId } = req;

      response.success(res, 'Academic years retrieved', []);
    } catch (error) {
      next(error);
    }
  }

  async setActiveYear(req, res, next) {
    try {
      const { id } = req.params;

      response.success(res, 'Academic year set as active', {});
    } catch (error) {
      next(error);
    }
  }

  async deleteAcademicYear(req, res, next) {
    try {
      const { id } = req.params;

      response.success(res, 'Academic year deleted');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AcademicYearController();
