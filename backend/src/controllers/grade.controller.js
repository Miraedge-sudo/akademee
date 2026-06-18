/**
 * Grade Controller
 */

const response = require('../utils/response');

class GradeController {
  async recordGrade(req, res, next) {
    try {
      const { studentId, subjectId, periodId, score } = req.body;
      const { schoolId } = req;

      response.success(res, 'Grade recorded', {}, 201);
    } catch (error) {
      next(error);
    }
  }

  async getStudentGrades(req, res, next) {
    try {
      const { studentId } = req.params;

      response.success(res, 'Grades retrieved', []);
    } catch (error) {
      next(error);
    }
  }

  async getPeriodGrades(req, res, next) {
    try {
      const { periodId, classId } = req.params;

      response.success(res, 'Period grades retrieved', []);
    } catch (error) {
      next(error);
    }
  }

  async updateGrade(req, res, next) {
    try {
      const { id } = req.params;
      const { score } = req.body;

      response.success(res, 'Grade updated', {});
    } catch (error) {
      next(error);
    }
  }

  async deleteGrade(req, res, next) {
    try {
      const { id } = req.params;

      response.success(res, 'Grade deleted');
    } catch (error) {
      next(error);
    }
  }

  async bulkUploadGrades(req, res, next) {
    try {
      const { file } = req;

      response.success(res, 'Grades uploaded', {});
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GradeController();
