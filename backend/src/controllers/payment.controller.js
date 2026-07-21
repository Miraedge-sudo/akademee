const sql = require('../config/database');
const response = require('../utils/response');
const paymentService = require('../services/payment.service');
const studentFeeService = require('../services/studentFee.service');
const feeCalculationService = require('../services/feeCalculation.service');

class PaymentController {
  async initiatePayment(req, res, next) {
    try {
      const { studentId, amount, method, feeId, academicYearId, reference } = req.body;
      const { schoolId } = req;
      const isFr = (req.headers['accept-language'] || 'fr').startsWith('fr');

      // 1. Create the payment (with built-in duplicate check)
      const payment = await paymentService.create(schoolId, { studentId, amount, method, feeId, academicYearId, reference });

      // 2. Update student_fees table — add the paid amount to the specific fee assignment
      const updatedFee = await studentFeeService.updatePayment(schoolId, studentId, feeId, amount, academicYearId);
      if (!updatedFee) {
        console.warn(`[PAYMENT] No student_fees record for student=${studentId}, fee=${feeId}. Payment ${payment.id} recorded.`);
      }

      // 3. Recalculate and persist the student's overall fee_status on the students table
      const feeStatus = await feeCalculationService.calculateStudentFeeStatus(schoolId, studentId);
      await sql`
        UPDATE students
        SET fee_status = ${feeStatus.status}
        WHERE student_id = ${studentId} AND school_id = ${schoolId}
      `;

      response.success(res, 'Payment initiated', payment, 201);
    } catch (error) {
      if (error.message === 'DUPLICATE_PAYMENT') {
        const msg = isFr
          ? 'Un paiement identique a déjà été effectué aujourd\'hui pour cet élève.'
          : 'An identical payment has already been made today for this student.';
        return response.error(res, msg, null, 409);
      }
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
      const { academicYearId } = req.query;
      const result = await paymentService.listByStudent(schoolId, studentId, { academicYearId });
      response.success(res, 'Payments retrieved', result);
    } catch (error) {
      next(error);
    }
  }

  async getSchoolPayments(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { limit = 10, offset = 0, status, startDate, endDate, academicYearId } = req.query;
      const result = await paymentService.listBySchool(schoolId, { limit, offset, status, startDate, endDate, academicYearId });
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
      const { startDate, endDate, academicYearId } = req.query;
      const schoolId = req.schoolId || req.user?.schoolId;
      const result = await paymentService.generateReport(schoolId, { startDate, endDate, academicYearId });
      response.success(res, 'Payment report generated', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
