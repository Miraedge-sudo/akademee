const response = require('../utils/response');
const reportService = require('../services/report.service');

class ReportController {
  async generateBulletin(req, res, next) {
    try {
      const { studentId, periodId } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await reportService.generateBulletin(schoolId, studentId, periodId || null);
      response.success(res, 'Bulletin generated', result);
    } catch (error) {
      if (error.message === 'Student not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async generateBulletinSimple(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await reportService.generateBulletin(schoolId, id, null);
      response.success(res, 'Bulletin generated', result);
    } catch (error) {
      if (error.message === 'Student not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async generateClassReport(req, res, next) {
    try {
      const { classId, periodId } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await reportService.generateClassReport(schoolId, classId, periodId || null);
      response.success(res, 'Class report generated', result);
    } catch (error) {
      if (error.message.includes('not found')) {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async generateClassReportSimple(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await reportService.generateClassReport(schoolId, id, null);
      response.success(res, 'Class report generated', result);
    } catch (error) {
      if (error.message.includes('not found')) {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async getStudentPerformance(req, res, next) {
    try {
      const { studentId } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await reportService.getStudentPerformance(schoolId, studentId);
      response.success(res, 'Performance data retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async downloadBulletin(req, res, next) {
    try {
      const { studentId, periodId } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const pdfBuffer = await reportService.generateBulletinPdf(schoolId, studentId, periodId || null);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=bulletin-${studentId}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  async downloadBulletinSimple(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const pdfBuffer = await reportService.generateBulletinPdf(schoolId, id, null);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=bulletin-${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  async exportReport(req, res, next) {
    try {
      const { reportId } = req.params;
      const { format } = req.query;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await reportService.exportReport(schoolId, reportId, format);
      response.success(res, 'Report exported', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
