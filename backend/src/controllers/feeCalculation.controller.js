const response = require('../utils/response');
const feeCalculationService = require('../services/feeCalculation.service');

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

  async updateAllStatuses(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user.schoolId;
      const result = await feeCalculationService.updateAllStudentStatuses(schoolId);
      response.success(res, 'Fee statuses updated', result);
    } catch (error) { next(error); }
  }
}

module.exports = new FeeCalculationController();
