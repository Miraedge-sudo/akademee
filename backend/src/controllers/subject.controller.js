/**
 * Subject Controller
 */

const response = require('../utils/response');

class SubjectController {
  async createSubject(req, res, next) {
    try {
      const { name, code, classId } = req.body;
      const { schoolId } = req;

      response.success(res, 'Subject created', {}, 201);
    } catch (error) {
      next(error);
    }
  }

  async getSubject(req, res, next) {
    try {
      const { id } = req.params;

      response.success(res, 'Subject retrieved', {});
    } catch (error) {
      next(error);
    }
  }

  async getClassSubjects(req, res, next) {
    try {
      const { classId } = req.params;

      response.success(res, 'Subjects retrieved', []);
    } catch (error) {
      next(error);
    }
  }

  async updateSubject(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      response.success(res, 'Subject updated', {});
    } catch (error) {
      next(error);
    }
  }

  async deleteSubject(req, res, next) {
    try {
      const { id } = req.params;

      response.success(res, 'Subject deleted');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SubjectController();
