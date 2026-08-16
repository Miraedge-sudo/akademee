const logger = require('../utils/logger');
const response = require('../utils/response');
const feeService = require('../services/fee.service');
const studentFeeService = require('../services/studentFee.service');

class FeeController {
  async createFeeStructure(req, res, next) {
    try {
      const { name, amount, classId, description, dueDate } = req.body;
      const { schoolId } = req;
      const result = await feeService.create(schoolId, { name, amount, classId, description, dueDate });
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
      const { limit, offset, includeArchived } = req.query;
      const result = await feeService.listBySchool(schoolId, {
        limit,
        offset,
        includeArchived: includeArchived === 'true' || includeArchived === '1',
      });
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
      // Un frais payé ne peut pas être supprimé → 409 avec un message clair
      // (le frontend propose alors d'archiver le frais à la place).
      if (error.message.includes('has payments')) {
        return response.error(
          res,
          'Ce frais a déjà été payé par des élèves et ne peut pas être supprimé. Vous pouvez l\'archiver à la place.',
          { code: 'FEE_HAS_PAYMENTS' },
          409
        );
      }
      next(error);
    }
  }

  async archiveFeeStructure(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await feeService.archive(schoolId, id);
      response.success(res, 'Fee structure archived', result);
    } catch (error) {
      if (error.message === 'Fee not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async unarchiveFeeStructure(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await feeService.unarchive(schoolId, id);
      response.success(res, 'Fee structure restored', result);
    } catch (error) {
      if (error.message === 'Fee not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async assignFeesToClass(req, res, next) {
    try {
      const { classId, feeIds, academicYearId, replace = false } = req.body;
      const schoolId = req.schoolId || req.user?.schoolId;

      if (!classId || !Array.isArray(feeIds)) {
        return response.error(res, 'classId and feeIds array are required', null, 400);
      }
      if (!replace && feeIds.length === 0) {
        return response.error(res, 'At least one fee must be selected', null, 400);
      }

      if (!schoolId) {
        return response.error(res, 'School ID not found. Authentication required.', null, 401);
      }

      // Trim UUIDs to avoid whitespace issues
      const cleanClassId = typeof classId === 'string' ? classId.trim() : classId;
      const cleanFeeIds = feeIds.map((id) => (typeof id === 'string' ? id.trim() : id));
      const cleanAcademicYearId =
        academicYearId && typeof academicYearId === 'string' ? academicYearId.trim() : null;

      const result = await studentFeeService.assignFeesToClass(
        schoolId,
        cleanClassId,
        cleanFeeIds,
        cleanAcademicYearId,
        { replace: replace === true }
      );

      response.success(res, 'Fees assigned to class', result, 201);
    } catch (error) {
      // Log full error details for debugging
      logger.error('assignFeesToClass failed', {
        error: error.message,
        stack: error.stack,
        code: error.code,
        detail: error.detail,
        constraint: error.constraint,
        body: req.body,
        reqId: req.reqId,
        schoolId: req.schoolId || req.user?.schoolId,
      });
      next(error);
    }
  }
}

module.exports = new FeeController();
