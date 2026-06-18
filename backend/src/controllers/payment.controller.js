/**
 * Payment Controller
 */

const response = require('../utils/response');

class PaymentController {
  async initiatePayment(req, res, next) {
    try {
      const { studentId, amount, feeId, reference } = req.body;
      const { schoolId } = req;

      response.success(res, 'Payment initiated', {}, 201);
    } catch (error) {
      next(error);
    }
  }

  async getPayment(req, res, next) {
    try {
      const { id } = req.params;

      response.success(res, 'Payment retrieved', {});
    } catch (error) {
      next(error);
    }
  }

  async getStudentPayments(req, res, next) {
    try {
      const { studentId } = req.params;
      const { limit = 10, offset = 0 } = req.query;

      response.success(res, 'Payments retrieved', []);
    } catch (error) {
      next(error);
    }
  }

  async getSchoolPayments(req, res, next) {
    try {
      const { schoolId } = req;
      const { limit = 10, offset = 0 } = req.query;

      response.success(res, 'School payments retrieved', []);
    } catch (error) {
      next(error);
    }
  }

  async confirmPayment(req, res, next) {
    try {
      const { reference } = req.body;

      response.success(res, 'Payment confirmed', {});
    } catch (error) {
      next(error);
    }
  }

  async generatePaymentReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const { schoolId } = req;

      response.success(res, 'Payment report generated', {});
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
