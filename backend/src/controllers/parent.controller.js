/**
 * Parent Controller — portal endpoints for the PARENT role.
 */

const response = require('../utils/response');
const parentService = require('../services/parent.service');

class ParentController {
  async getMyChildren(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const children = await parentService.getMyChildren(schoolId, { userId: req.user?.userId, email: req.user?.email });
      response.success(res, 'Children retrieved', children);
    } catch (error) {
      next(error);
    }
  }

  async getMyFees(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { academicYearId } = req.query;
      const fees = await parentService.getMyFees(schoolId, req.user?.userId, req.user?.email, { academicYearId });
      response.success(res, 'Fees retrieved', fees);
    } catch (error) {
      next(error);
    }
  }

  async payFee(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const isFr = (req.headers['accept-language'] || 'fr').startsWith('fr');
      const payment = await parentService.payFee(schoolId, req.user?.userId, req.user?.email, req.body);
      response.success(res, isFr ? 'Paiement effectué' : 'Payment successful', payment, 201);
    } catch (error) {
      if (error.message === 'This student is not linked to your account') {
        return response.error(res, error.message, null, 403);
      }
      if (error.message === 'DUPLICATE_PAYMENT') {
        const msg = (req.headers['accept-language'] || 'fr').startsWith('fr')
          ? "Un paiement identique a déjà été effectué aujourd'hui pour cet élève."
          : 'An identical payment has already been made today for this student.';
        return response.error(res, msg, null, 409);
      }
      if (error.message === 'FEE_ALREADY_PAID') {
        const msg = (req.headers['accept-language'] || 'fr').startsWith('fr')
          ? 'Ce frais a déjà été entièrement payé.'
          : 'This fee has already been fully paid.';
        return response.error(res, msg, null, 400);
      }
      if (error.message === 'OVERPAYMENT') {
        const msg = (req.headers['accept-language'] || 'fr').startsWith('fr')
          ? 'Le montant dépasse le solde restant dû.'
          : 'Payment amount exceeds the remaining balance.';
        return response.error(res, msg, null, 400);
      }
      next(error);
    }
  }

  async getMyPayments(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const { academicYearId } = req.query;
      const payments = await parentService.getMyPayments(schoolId, req.user?.userId, req.user?.email, { academicYearId });
      response.success(res, 'Payments retrieved', payments);
    } catch (error) {
      next(error);
    }
  }

  async getMyMessages(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const messages = await parentService.getMyMessages(schoolId, req.user?.userId);
      response.success(res, 'Messages retrieved', messages);
    } catch (error) {
      next(error);
    }
  }

  async getMessageThread(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const thread = await parentService.getMessageThread(schoolId, req.user?.userId, req.params.id);
      response.success(res, 'Message thread retrieved', thread);
    } catch (error) {
      if (error.message === 'Message not found') {
        return response.error(res, error.message, null, 404);
      }
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const message = await parentService.sendMessage(schoolId, req.user?.userId, req.body);
      response.success(res, 'Message sent', message, 201);
    } catch (error) {
      if (error.message.includes('not linked')) {
        return response.error(res, error.message, null, 403);
      }
      if (error.message.includes('required')) {
        return response.error(res, error.message, null, 400);
      }
      next(error);
    }
  }

  async replyToMessage(req, res, next) {
    try {
      const schoolId = req.schoolId || req.user?.schoolId;
      const reply = await parentService.replyToMessage(schoolId, req.user?.userId, req.params.id, req.body);
      response.success(res, 'Reply sent', reply, 201);
    } catch (error) {
      if (error.message === 'Message not found') {
        return response.error(res, error.message, null, 404);
      }
      if (error.message.includes('required')) {
        return response.error(res, error.message, null, 400);
      }
      next(error);
    }
  }
}

module.exports = new ParentController();
