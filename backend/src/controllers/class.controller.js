/**
 * Class Controller
 */

const response = require('../utils/response');

class ClassController {
  async createClass(req, res, next) {
    try {
      const { name, classTeacherId, academicYearId } = req.body;
      const { schoolId } = req;

      response.success(res, 'Class created', {}, 201);
    } catch (error) {
      next(error);
    }
  }

  async getClass(req, res, next) {
    try {
      const { id } = req.params;

      response.success(res, 'Class retrieved', {});
    } catch (error) {
      next(error);
    }
  }

  async getSchoolClasses(req, res, next) {
    try {
      const { schoolId } = req;

      response.success(res, 'Classes retrieved', []);
    } catch (error) {
      next(error);
    }
  }

  async updateClass(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      response.success(res, 'Class updated', {});
    } catch (error) {
      next(error);
    }
  }

  async deleteClass(req, res, next) {
    try {
      const { id } = req.params;

      response.success(res, 'Class deleted');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClassController();
