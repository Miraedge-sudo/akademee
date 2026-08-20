/**
 * Billing Service — Fapshi payment integration for subscription upgrades.
 *
 * Security constraints:
 * - upgradePlan is ONLY called internally after webhook confirmation
 * - Amount is always looked up server-side from subscription_plans
 * - Webhook authenticity is verified via x-wh-secret header
 * - Payment status is double-checked by calling Fapshi API (never trust raw webhook)
 * - Idempotent: duplicate webhooks for the same externalId are ignored
 *
 * NOTE: The official fapshi npm SDK hardcodes baseUrl to live.fapshi.com
 * and does not support sandbox mode. We use direct HTTP calls instead.
 */

const axios = require('axios');
const crypto = require('crypto');
const sql = require('../config/database');
const fapshiConfig = require('../config/fapshi');
const schoolService = require('./school.service');

/**
 * Direct Fapshi API client (replaces the npm SDK which lacks sandbox support)
 */
const fapshiApi = {
  headers: {
    apiuser: fapshiConfig.apiUser,
    apikey: fapshiConfig.apiKey,
    'Content-Type': 'application/json',
  },

  async initiatePay({ amount, email, userId, externalId, redirectUrl, message }) {
    const res = await axios.post(
      `${fapshiConfig.baseUrl}/initiate-pay`,
      { amount, email, userId, externalId, redirectUrl, message },
      { headers: this.headers, timeout: 15000 }
    );
    return res.data;
  },

  async paymentStatus(transId) {
    const res = await axios.get(
      `${fapshiConfig.baseUrl}/payment-status/${transId}`,
      { headers: this.headers, timeout: 15000 }
    );
    return res.data;
  },

  async balance() {
    const res = await axios.get(
      `${fapshiConfig.baseUrl}/balance`,
      { headers: this.headers, timeout: 15000 }
    );
    return res.data;
  },
};

class BillingService {
  /**
   * Generate a unique external ID for payment tracking
   */
  generateExternalId(schoolId, planCode) {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    const schoolShort = schoolId.toString().replace(/-/g, '').substring(0, 8);
    return `${schoolShort}-${planCode}-${timestamp}-${random}`;
  }

  /**
   * Initiate a Fapshi payment for a plan upgrade.
   * Only called by authenticated admin — amount comes from DB, not from request.
   */
  async initiatePayment(schoolId, planCode, adminEmail) {
    // 1. Look up the plan server-side (never trust frontend amounts)
    const plans = await sql`
      SELECT plan_id, code, name, price, currency
      FROM subscription_plans
      WHERE code = ${planCode} AND is_active = true
    `;

    if (plans.length === 0) {
      throw new Error('Invalid or inactive plan');
    }

    const plan = plans[0];
    const amount = Number(plan.price);

    if (amount <= 0) {
      throw new Error('This plan is free and does not require payment');
    }

    // 2. Verify the school exists
    const schools = await sql`
      SELECT school_id, name, subdomain
      FROM schools WHERE school_id = ${schoolId}
    `;
    if (schools.length === 0) {
      throw new Error('School not found');
    }

    const school = schools[0];

    // 3. Generate unique external ID
    const externalId = this.generateExternalId(schoolId, planCode);

    // 4. Build redirect URL (frontend billing confirmation page)
    const isLive = fapshiConfig.environment === 'live';
    // FRONTEND_URL is the public URL where the frontend is accessible (for Fapshi redirect)
    // APP_HOST is the backend public URL (for production domain)
    const frontendUrl = process.env.FRONTEND_URL || process.env.APP_HOST;
    if (!frontendUrl) {
      const msg = 'FRONTEND_URL or APP_HOST env var is not set.';
      if (isLive) throw new Error(msg);
      console.warn(`[BillingService] ${msg} Falling back to localhost:3000 for sandbox.`);
    }
    // Build redirect URL — handle both bare hostnames and full URLs
    let redirectBase = frontendUrl || 'localhost:3000';
    if (!redirectBase.startsWith('http://') && !redirectBase.startsWith('https://')) {
      const protocol = isLive ? 'https' : 'http';
      redirectBase = `${protocol}://${redirectBase}`;
    }
    const redirectUrl = `${redirectBase}/billing/confirm`;

    // 5. Call Fapshi initiatePay via direct HTTP (SDK doesn't support sandbox)
    let fapshiResponse;
    try {
      fapshiResponse = await fapshiApi.initiatePay({
        amount,
        email: adminEmail || undefined,
        userId: schoolId.toString().replace(/-/g, '').substring(0, 100),
        externalId,
        redirectUrl,
        message: `Upgrade ${school.name} to ${plan.name} plan`,
      });
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      console.error('[BillingService] Fapshi initiatePay error:', errMsg);
      throw new Error(`Failed to initiate payment: ${errMsg}`);
    }

    if (!fapshiResponse || !fapshiResponse.link) {
      throw new Error('Fapshi did not return a payment link');
    }

    // 6. Create pending record in subscription_payments
    await sql`
      INSERT INTO subscription_payments (
        school_id, plan_code, amount, currency,
        fapshi_trans_id, fapshi_external_id,
        status, payer_email, created_at
      ) VALUES (
        ${schoolId}, ${planCode}, ${amount}, ${plan.currency || 'FCFA'},
        ${fapshiResponse.transId || null}, ${externalId},
        'pending', ${adminEmail || null}, NOW()
      )
    `;

    console.log(`[BillingService] Payment initiated: ${externalId} | plan=${planCode} | amount=${amount} | transId=${fapshiResponse.transId}`);

    return {
      paymentUrl: fapshiResponse.link,
      transId: fapshiResponse.transId,
      externalId,
      amount,
      planCode,
      planName: plan.name,
    };
  }

  /**
   * Handle incoming Fapshi webhook.
   * 1. Verify webhook secret (x-wh-secret header)
   * 2. Find payment by externalId
   * 3. Actively call Fapshi API to confirm status (never trust raw webhook)
   * 4. If successful → call upgradePlan internally
   * 5. Idempotent — ignore if already processed
   */
  async handleWebhook(payload, webhookSecret) {
    // 1. Verify webhook authenticity
    if (fapshiConfig.webhookSecret && webhookSecret !== fapshiConfig.webhookSecret) {
      console.error('[BillingService] Webhook secret mismatch — rejecting');
      throw new Error('Invalid webhook secret');
    }

    const { externalId, transId, status } = payload;

    if (!externalId && !transId) {
      throw new Error('Webhook missing externalId and transId');
    }

    // 2. Find the payment record
    const payments = externalId
      ? await sql`SELECT * FROM subscription_payments WHERE fapshi_external_id = ${externalId}`
      : await sql`SELECT * FROM subscription_payments WHERE fapshi_trans_id = ${transId}`;

    if (payments.length === 0) {
      console.warn(`[BillingService] Webhook for unknown payment: externalId=${externalId} transId=${transId}`);
      return { processed: false, reason: 'payment_not_found' };
    }

    const payment = payments[0];

    // 3. Idempotency — already processed, skip
    if (payment.status === 'successful') {
      console.log(`[BillingService] Webhook idempotent skip: ${payment.fapshi_external_id} already successful`);
      return { processed: false, reason: 'already_processed' };
    }

    // 4. Actively verify with Fapshi API (never trust raw webhook body)
    const fapshiTransId = payment.fapshi_trans_id || transId;
    if (!fapshiTransId) {
      console.error(`[BillingService] No transId to verify for payment ${payment.payment_id}`);
      return { processed: false, reason: 'no_trans_id' };
    }

    let verifiedStatus;
    try {
      const statusResponse = await fapshiApi.paymentStatus(fapshiTransId);
      verifiedStatus = statusResponse?.status;
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      console.error(`[BillingService] Failed to verify status with Fapshi: ${errMsg}`);
      return { processed: false, reason: 'verification_failed', error: errMsg };
    }

    console.log(`[BillingService] Fapshi verified status for ${fapshiTransId}: ${verifiedStatus}`);

    // 5. Update payment record based on verified status
    if (verifiedStatus === 'SUCCESSFUL') {
      await sql`
        UPDATE subscription_payments
        SET status = 'successful',
            payer_name = ${payload.payerName || null},
            payer_email = ${payload.email || null},
            raw_webhook = ${JSON.stringify(payload)}::jsonb,
            updated_at = NOW()
        WHERE payment_id = ${payment.payment_id}
      `;

      // 6. Call upgradePlan internally — the ONLY place it should be called
      try {
        await schoolService.upgradePlan(payment.school_id, payment.plan_code);
        console.log(`[BillingService] ✅ Plan upgraded: school=${payment.school_id} plan=${payment.plan_code}`);
      } catch (err) {
        console.error(`[BillingService] upgradePlan failed after payment: ${err.message}`);
        return { processed: false, reason: 'upgrade_failed', error: err.message };
      }

      return { processed: true, schoolId: payment.school_id, planCode: payment.plan_code };

    } else if (verifiedStatus === 'FAILED' || verifiedStatus === 'EXPIRED') {
      await sql`
        UPDATE subscription_payments
        SET status = ${verifiedStatus === 'FAILED' ? 'failed' : 'expired'},
            raw_webhook = ${JSON.stringify(payload)}::jsonb,
            updated_at = NOW()
        WHERE payment_id = ${payment.payment_id}
      `;
      console.log(`[BillingService] Payment ${verifiedStatus.toLowerCase()}: ${payment.fapshi_external_id}`);
      return { processed: false, reason: `payment_${verifiedStatus.toLowerCase()}` };
    }

    // Status is CREATED or PENDING — not yet conclusive
    console.log(`[BillingService] Payment still pending: ${fapshiTransId} status=${verifiedStatus}`);
    return { processed: false, reason: 'still_pending', verifiedStatus };
  }

  /**
   * Check payment status for a given school (used by frontend polling)
   */
  async getPaymentStatus(schoolId) {
    const payments = await sql`
      SELECT payment_id, plan_code, amount, status, fapshi_trans_id,
             created_at, updated_at
      FROM subscription_payments
      WHERE school_id = ${schoolId}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    return payments.map((p) => ({
      id: p.payment_id,
      planCode: p.plan_code,
      amount: Number(p.amount),
      status: p.status,
      transId: p.fapshi_trans_id,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  }

  /**
   * Manually confirm a pending payment — dev-only fallback when webhook can't reach localhost.
   * Finds the latest pending payment for the school, verifies with Fapshi API, upgrades if successful.
   */
  async confirmManual(schoolId) {
    const payments = await sql`
      SELECT * FROM subscription_payments
      WHERE school_id = ${schoolId} AND status = 'pending'
      ORDER BY created_at DESC LIMIT 1
    `;

    if (payments.length === 0) {
      throw new Error('No pending payment found for this school');
    }

    const payment = payments[0];
    const fapshiTransId = payment.fapshi_trans_id;

    if (!fapshiTransId) {
      throw new Error('Payment has no Fapshi transaction ID');
    }

    // Verify with Fapshi API
    let verifiedStatus;
    try {
      const statusResponse = await fapshiApi.paymentStatus(fapshiTransId);
      verifiedStatus = statusResponse?.status;
    } catch (err) {
      throw new Error(`Failed to verify with Fapshi: ${err.response?.data?.message || err.message}`);
    }

    console.log(`[BillingService] Manual confirm: ${fapshiTransId} → ${verifiedStatus}`);

    if (verifiedStatus === 'SUCCESSFUL') {
      await sql`
        UPDATE subscription_payments SET status = 'successful', updated_at = NOW()
        WHERE payment_id = ${payment.payment_id}
      `;
      await schoolService.upgradePlan(payment.school_id, payment.plan_code);
      return { confirmed: true, planCode: payment.planCode, transId: fapshiTransId };
    }

    return { confirmed: false, status: verifiedStatus, transId: fapshiTransId };
  }

  /**
   * Get subscription status for a school (used by frontend polling after redirect)
   */
  async getSubscriptionStatus(schoolId) {
    const schools = await sql`
      SELECT subscription_plan, subscription_status, subscription_start_date, subscription_end_date
      FROM schools WHERE school_id = ${schoolId}
    `;

    if (schools.length === 0) return null;

    const school = schools[0];
    return {
      plan: school.subscription_plan,
      status: school.subscription_status,
      startDate: school.subscription_start_date,
      endDate: school.subscription_end_date,
    };
  }
}

module.exports = new BillingService();
