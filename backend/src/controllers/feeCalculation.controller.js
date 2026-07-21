const response = require('../utils/response');
const feeCalculationService = require('../services/feeCalculation.service');
const studentFeeService = require('../services/studentFee.service');

class FeeCalculationController {
  async getStudentFeeStatus(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const result = await feeCalculationService.calculateStudentFeeStatus(schoolId, req.params.studentId);
      response.success(res, 'Fee status retrieved', result);
    } catch (error) { next(error); }
  }

  async getStudentFeeSummary(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const result = await feeCalculationService.getStudentFeeSummary(schoolId, req.params.studentId);
      response.success(res, 'Fee summary retrieved', result);
    } catch (error) { next(error); }
  }

  async getStudentFeeBreakdown(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const fees = await studentFeeService.listByStudent(schoolId, req.params.studentId);
      response.success(res, 'Fee breakdown retrieved', fees);
    } catch (error) { next(error); }
  }

  async getClassAssignedFees(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { classId } = req.params;
      const { academicYearId } = req.query;
      const result = await studentFeeService.listByClass(schoolId, classId, academicYearId || null);
      response.success(res, 'Assigned fees retrieved', result);
    } catch (error) { next(error); }
  }

  async updateAllStatuses(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const result = await feeCalculationService.updateAllStudentStatuses(schoolId);
      response.success(res, 'Fee statuses updated', result);
    } catch (error) { next(error); }
  }
}

module.exports = new FeeCalculationController();
