const sql = require('../config/database');
const response = require('../utils/response');
const gradeService = require('../services/grade.service');
const gradeCalculationService = require('../services/gradeCalculation.service');

class GradeController {
  async recordGrade(req, res, next) {
    try {
      const { studentId, subjectId, periodId, sequenceId, score, comment } = req.body;
      const { schoolId } = req;
      const result = await gradeService.create(schoolId, { studentId, subjectId, periodId, sequenceId, score, comment });
      response.success(res, 'Grade recorded', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getStudentGrades(req, res, next) {
    try {
      const { studentId } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const { academicYearId } = req.query;
      const result = await gradeService.listByStudent(schoolId, studentId, { academicYearId });
      response.success(res, 'Grades retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getClassGrades(req, res, next) {
    try {
      const { classId } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const { academicYearId } = req.query;
      const result = await gradeService.listByClass(schoolId, classId, { academicYearId });
      response.success(res, 'Class grades retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getPeriodGrades(req, res, next) {
    try {
      const { periodId, classId } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const { academicYearId } = req.query;
      const result = await gradeService.listBySchool(schoolId, { periodId, academicYearId });
      response.success(res, 'Period grades retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getAllGrades(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit, offset, studentId, subjectId, periodId, academicYearId } = req.query;
      const result = await gradeService.listBySchool(schoolId, { limit, offset, studentId, subjectId, periodId, academicYearId });
      response.success(res, 'Grades retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getReportCard(req, res, next) {
    try {
      const { studentId } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const { periodId } = req.query;
      const college = await sql`SELECT academic_system FROM schools WHERE school_id = ${schoolId}`;
      const system = college[0]?.academic_system || 'TERM_SEQUENCE';
      const result = await gradeCalculationService.calculateStudentAverages(schoolId, studentId, system);
      response.success(res, 'Report card data retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async updateGrade(req, res, next) {
    try {
      const { id } = req.params;
      const { score, comment } = req.body;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await gradeService.update(schoolId, id, { score, comment });
      response.success(res, 'Grade updated', result);
    } catch (error) {
      if (error.message === 'Grade not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async deleteGrade(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await gradeService.delete(schoolId, id);
      response.success(res, 'Grade deleted', result);
    } catch (error) {
      if (error.message === 'Grade not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async bulkUploadGrades(req, res, next) {
    try {
      const { grades } = req.body;
      const { schoolId } = req;
      if (!grades || !Array.isArray(grades)) {
        return response.error(res, 'grades must be an array', null, 400);
      }
      const results = [];
      for (const g of grades) {
        const result = await gradeService.create(schoolId, g);
        results.push(result);
      }
      response.success(res, 'Grades uploaded', results, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GradeController();
