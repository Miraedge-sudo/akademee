/**
 * Report Controller
 */

const response = require('../utils/response');

class ReportController {
  async generateBulletin(req, res, next) {
    try {
      const { studentId, periodId } = req.params;

      response.success(res, 'Bulletin generated', {});
    } catch (error) {
      next(error);
    }
  }

  async generateClassReport(req, res, next) {
    try {
      const { classId, periodId } = req.params;

      response.success(res, 'Class report generated', {});
    } catch (error) {
      next(error);
    }
  }

  async getStudentPerformance(req, res, next) {
    try {
      const { studentId } = req.params;

      response.success(res, 'Performance data retrieved', {});
    } catch (error) {
      next(error);
    }
  }

  async exportReport(req, res, next) {
    try {
      const { reportId } = req.params;
      const { format } = req.query; // pdf, excel, etc.

      response.success(res, 'Report exported', {});
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
