const response = require('../utils/response');
const feeService = require('../services/fee.service');
const studentFeeService = require('../services/studentFee.service');

class FeeController {
  async createFeeStructure(req, res, next) {
    try {
      const { name, amount, classId, description } = req.body;
      const { schoolId } = req;
      const result = await feeService.create(schoolId, { name, amount, classId, description });
      response.success(res, 'Fee structure created', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getFeeStructure(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await feeService.getById(schoolId, id);
      response.success(res, 'Fee structure retrieved', result);
    } catch (error) {
      if (error.message === 'Fee not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async getSchoolFees(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit, offset } = req.query;
      const result = await feeService.listBySchool(schoolId, { limit, offset });
      response.success(res, 'Fees retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async updateFeeStructure(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await feeService.update(schoolId, id, updateData);
      response.success(res, 'Fee structure updated', result);
    } catch (error) {
      if (error.message === 'Fee not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async deleteFeeStructure(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await feeService.delete(schoolId, id);
      response.success(res, 'Fee structure deleted', result);
    } catch (error) {
      if (error.message === 'Fee not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async assignFeesToClass(req, res, next) {
    try {
      const { classId, feeIds, academicYearId } = req.body;
      const schoolId = req.schoolId || req.user?.schoolId;
      if (!classId || !feeIds || !Array.isArray(feeIds)) {
        return response.error(res, 'classId and feeIds array are required', null, 400);
      }
      const result = await studentFeeService.assignFeesToClass(schoolId, classId, feeIds, academicYearId);
      response.success(res, 'Fees assigned to class', result, 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeeController();
