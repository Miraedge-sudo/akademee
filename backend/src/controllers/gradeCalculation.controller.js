const response = require('../utils/response');
const gradeCalculationService = require('../services/gradeCalculation.service');

class GradeCalculationController {
  async calculateAverages(req, res, next) {
    try {
      const { studentId } = req.params;
      const schoolId = req.schoolId || req.user.schoolId;
      const school = await require('../config/database')`
        SELECT academic_system FROM schools WHERE school_id = ${schoolId}
      `;
      const system = school[0]?.academic_system || 'TERM_SEQUENCE';
      const result = await gradeCalculationService.calculateStudentAverages(schoolId, studentId, system);
      response.success(res, 'Averages calculated', result);
    } catch (error) { next(error); }
  }

  async calculateClassRankings(req, res, next) {
    try {
      const { classId } = req.params;
      const { periodId } = req.query;
      const schoolId = req.schoolId || req.user.schoolId;
      const result = await gradeCalculationService.calculateClassRankings(schoolId, classId, periodId);
      response.success(res, 'Class rankings calculated', result);
    } catch (error) { next(error); }
  }

  async calculate(req, res, next) {
    try {
      const { studentId, classId, periodId } = req.body;
      const schoolId = req.schoolId || req.user.schoolId;

      if (classId) {
        const result = await gradeCalculationService.calculateClassRankings(schoolId, classId, periodId);
        return response.success(res, 'Grades calculated', result);
      }

      if (studentId) {
        const school = await require('../config/database')`
          SELECT academic_system FROM schools WHERE school_id = ${schoolId}
        `;
        const system = school[0]?.academic_system || 'TERM_SEQUENCE';
        const result = await gradeCalculationService.calculateStudentAverages(schoolId, studentId, system);
        return response.success(res, 'Grades calculated', result);
      }

      response.error(res, 'Provide studentId or classId in request body', null, 400);
    } catch (error) { next(error); }
  }
}

module.exports = new GradeCalculationController();
