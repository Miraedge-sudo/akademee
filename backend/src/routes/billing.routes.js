/**
 * Billing Routes — Fapshi payment integration for subscription upgrades.
 *
 * POST /api/billing/fapshi/initiate  — Admin initiates a payment (auth required)
 * POST /api/billing/fapshi/webhook   — Fapshi sends payment status updates (no auth — verified via x-wh-secret)
 * GET  /api/billing/payment-status   — Admin checks payment status (auth required)
 */

const express = require('express');
const billingController = require('../controllers/billing.controller');
const authMiddleware = require('../middleware/auth.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

// ── Fapshi webhook (NO auth — verified via x-wh-secret header) ──
router.post('/fapshi/webhook', billingController.webhook);

// ── Protected billing routes (admin only) ──
router.post(
  '/fapshi/initiate',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  billingController.initiate
);

router.get(
  '/payment-status',
  authMiddleware,
  tenantMiddleware,
  billingController.getPaymentStatus
);

// ── Manual confirm (dev only) — verifies pending payment with Fapshi API ──
router.post(
  '/confirm-manual',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  billingController.confirmManual
);

module.exports = router;
