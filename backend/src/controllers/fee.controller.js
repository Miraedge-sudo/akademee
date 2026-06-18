/**
 * Fee Controller
 */

const response = require('../utils/response');

class FeeController {
  async createFeeStructure(req, res, next) {
    try {
      const { name, amount, classId, description } = req.body;
      const { schoolId } = req;

      response.success(res, 'Fee structure created', {}, 201);
    } catch (error) {
      next(error);
    }
  }

  async getFeeStructure(req, res, next) {
    try {
      const { id } = req.params;

      response.success(res, 'Fee structure retrieved', {});
    } catch (error) {
      next(error);
    }
  }

  async getSchoolFees(req, res, next) {
    try {
      const { schoolId } = req;

      response.success(res, 'Fees retrieved', []);
    } catch (error) {
      next(error);
    }
  }

  async updateFeeStructure(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      response.success(res, 'Fee structure updated', {});
    } catch (error) {
      next(error);
    }
  }

  async deleteFeeStructure(req, res, next) {
    try {
      const { id } = req.params;

      response.success(res, 'Fee structure deleted');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeeController();
