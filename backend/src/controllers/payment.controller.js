const response = require('../utils/response');
const paymentService = require('../services/payment.service');

class PaymentController {
  async initiatePayment(req, res, next) {
    try {
      const { studentId, amount, method, feeId, reference } = req.body;
      const { schoolId } = req;
      const result = await paymentService.create(schoolId, { studentId, amount, method, feeId, reference });
      response.success(res, 'Payment initiated', result, 201);
    } catch (error) {
      next(error);
    }
  }

  async getPayment(req, res, next) {
    try {
      const { id } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await paymentService.getById(schoolId, id);
      response.success(res, 'Payment retrieved', result);
    } catch (error) {
      if (error.message === 'Payment not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async getStudentPayments(req, res, next) {
    try {
      const { studentId } = req.params;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await paymentService.listByStudent(schoolId, studentId);
      response.success(res, 'Payments retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getSchoolPayments(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit = 10, offset = 0, status, startDate, endDate } = req.query;
      const result = await paymentService.listBySchool(schoolId, { limit, offset, status, startDate, endDate });
      response.success(res, 'School payments retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async confirmPayment(req, res, next) {
    try {
      const { reference } = req.body;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await paymentService.confirm(schoolId, reference);
      response.success(res, 'Payment confirmed', result);
    } catch (error) {
      if (error.message === 'Payment not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async generatePaymentReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await paymentService.generateReport(schoolId, { startDate, endDate });
      response.success(res, 'Payment report generated', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
