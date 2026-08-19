/**
 * Billing Controller — Fapshi payment endpoints
 */

const response = require('../utils/response');
const billingService = require('../services/billing.service');

class BillingController {
  /**
   * POST /api/billing/fapshi/initiate
   * Admin initiates a plan upgrade payment via Fapshi.
   * Body: { planCode }
   * Amount is NEVER sent from the frontend — looked up server-side.
   */
  async initiate(req, res, next) {
    try {
      const { planCode } = req.body;
      const schoolId = req.user?.schoolId || req.schoolId;
      const adminEmail = req.user?.email;

      if (!schoolId) {
        return response.error(res, 'School not found', null, 400);
      }

      if (!planCode) {
        return response.error(res, 'Plan code is required', null, 400);
      }

      const result = await billingService.initiatePayment(schoolId, planCode, adminEmail);

      response.success(res, 'Payment initiated', {
        paymentUrl: result.paymentUrl,
        transId: result.transId,
        externalId: result.externalId,
        amount: result.amount,
        planCode: result.planCode,
        planName: result.planName,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/billing/fapshi/webhook
   * Fapshi sends payment status updates here.
   * No auth middleware — webhook is verified via x-wh-secret header.
   */
  async webhook(req, res, next) {
    try {
      const webhookSecret = req.headers['x-wh-secret'] || null;
      const payload = req.body;

      console.log('[BillingController] Webhook received:', JSON.stringify(payload).substring(0, 500));

      const result = await billingService.handleWebhook(payload, webhookSecret);

      // Always return 200 to Fapshi (they send only one webhook, regardless of response)
      res.status(200).json({ received: true, ...result });
    } catch (error) {
      console.error('[BillingController] Webhook error:', error.message);
      // Still return 200 to prevent Fapshi retries (we handle errors internally)
      res.status(200).json({ received: true, error: error.message });
    }
  }

  /**
   * GET /api/billing/payment-status
   * Authenticated — frontend polls this to check if payment was confirmed.
   */
  async getPaymentStatus(req, res, next) {
    try {
      const schoolId = req.user?.schoolId || req.schoolId;
      if (!schoolId) {
        return response.error(res, 'School not found', null, 400);
      }

      const payments = await billingService.getPaymentStatus(schoolId);
      const subscription = await billingService.getSubscriptionStatus(schoolId);

      response.success(res, 'Payment status retrieved', {
        payments,
        subscription,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BillingController();
