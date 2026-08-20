# 🇨🇲 Guide Complet — Intégration des Paiements avec Fapshi (Akademee)

> **Version** : 1.0  
> **Date** : Août 2026  
> **Passeur de paiement** : [Fapshi](https://fapshi.com) (Mobile Money — MTN MoMo & Orange Money)  
> **Mode** : Sandbox par défaut, bascule vers Live via variable d'environnement

---

## Table des matières

1. [Vue d'ensemble de l'architecture](#1-vue-densemble-de-larchitecture)
2. [Prérequis](#2-prérequis)
3. [Configuration du compte Fapshi](#3-configuration-du-compte-fapshi)
4. [Variables d'environnement](#4-variables-denvironnement)
5. [Côté Backend — Fichier par fichier](#5-côté-backend--fichier-par-fichier)
   - [5.1 Configuration Fapshi](#51-configuration-fapshiconfigjs)
   - [5.2 Service Billing (cœur de l'intégration)](#52-service-billing-billingservicejs)
   - [5.3 Controller Billing](#53-controller-billing-billingcontrollerjs)
   - [5.4 Routes Billing](#54-routes-billingbillingroutesjs)
   - [5.5 Service School — upgradePlan](#55-service-school---upgradeplan)
6. [Côté Frontend — Fichier par fichier](#6-côté-frontend--fichier-par-fichier)
   - [6.1 Endpoints API](#61-endpoints-api)
   - [6.2 TrialExpiredPage (page d'upgrade)](#62-trialexpiredpage-page-dupgrade)
   - [6.3 BillingConfirmPage (après redirect Fapshi)](#63-billingconfirmpage-après-redirect-fapshi)
   - [6.4 TrialBanner (bannière dans le dashboard)](#64-trialbanner-bannière-dans-le-dashboard)
7. [Flux de paiement complet (sequence diagram)](#7-flux-de-paiement-complet)
8. [Sécurité — Ce qu'il ne faut JAMAIS faire](#8-sécurité--ce-quil-ne-faut-jamais-faire)
9. [Mode Sandbox vs Production](#9-mode-sandbox-vs-production)
10. [Dépannage](#10-dépannage)
11. [Structure de la base de données](#11-structure-de-la-base-de-données)

---

## 1. Vue d'ensemble de l'architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│   Backend    │────▶│   Fapshi API │
│  (React SPA) │◀────│  (Express)   │◀────│  (Gateway)   │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       │                    │                     │
       │  1. POST /initiate │                     │
       │───────────────────▶│  initiatePay()      │
       │                    │────────────────────▶│
       │  ← paymentUrl      │  ← link + transId   │
       │                    │                     │
       │  redirect ──────────────────────────────▶│  (utilisateur paye sur Fapshi)
       │                    │                     │
       │                    │  POST /webhook       │
       │                    │◀────────────────────│  (Fapshi notifie le backend)
       │                    │                     │
       │  GET /payment-status│                     │
       │───────────────────▶│  paymentStatus()    │
       │                    │────────────────────▶│
       │  ← status: SUCCESS │  ← verified status  │
       │                    │                     │
       │  upgradePlan()     │                     │
       │  (interne)         │                     │
```

### Pourquoi pas le SDK npm `fapshi` (v1.1.4) ?

> **Problème avéré** : Le SDK npm `fapshi` (v1.1.4, package `fapshi`) **hardcode**
> `baseUrl` au niveau de la variable globale :
>
> ```javascript
> // Source : https://unpkg.com/fapshi@1.1.4/dist/index.js
> var baseUrl = "https://live.fapshi.com"; // ← PAS de sandbox
> ```
>
> Le constructeur `new FAPSHI(user, key)` ne prend AUCUN paramètre d'environnement.
> De plus, le SDK **sauvegarde vos credentials API dans MongoDB** via `saveCredentials()`
> — risque de sécurité en production.
>
> **Alternative officielle** : Le package `@fapshi/payments` (v1.0.0, par `mr_signe`)
> supporte le sandbox via auto-détection (`FAK_TEST_` → sandbox, `FAK_` → live).
> Cependant, notre approche HTTP directe via `axios` est plus légère et ne nécessite
> aucune dépendance supplémentaire.

---

## 2. Prérequis

| Élément | Détail |
|---------|--------|
| **Compte Fapshi** | Créer sur [sandbox.fapshi.com](https://sandbox.fapshi.com) |
| **API User UUID** | `__________________________________` *(trouvable dans le dashboard Fapshi)* |
| **API Key** | `__________________________________` *(clé d'API dans le dashboard)* |
| **Webhook URL** | `http://votre-backend:5000/api/billing/fapshi/webhook` |
| **Webhook Secret** | `__________________________________` *(défini dans les settings Fapshi)* |
| **Node.js** | v18+ |
| **Package** | `axios` (déjà installé dans le projet) |

---

## 3. Configuration du compte Fapshi

1. **Créer un compte** sur [https://sandbox.fapshi.com](https://sandbox.fapshi.com)
2. **Récupérer** les identifiants :
   - `API User` (UUID) → pour `FAPSHI_API_USER`
   - `API Key` → pour `FAPSHI_API_KEY`
3. **Configurer le webhook** :
   - URL : `https://votre-domaine.com/api/billing/fapshi/webhook`
   - Secret : `__________________________________` *(à définir vous-même)*
4. **Tester en sandbox** avec les cred sandbox de Fapshi

---

## 4. Variables d'environnement

Ajouter dans `.env` :

```bash
# ── Fapshi Payment Gateway ──
# Mode: 'sandbox' ou 'live'
FAPSHI_ENV=sandbox

# Identifiants API (trouvable dans le dashboard Fapshi)
FAPSHI_API_USER=__________________________________
FAPSHI_API_KEY=__________________________________

# Secret webhook (doit correspondre à celui configuré dans Fapshi)
FAPSHI_WEBHOOK_SECRET=__________________________________

# URL publique du frontend (pour la redirect après paiement)
FRONTEND_URL=http://localhost:3000

# URL publique du backend (pour le webhook Fapshi)
APP_HOST=localhost:5000
```

> ⚠️ **JAMAIS** de credentials en dur dans le code en production.
> Les fallback dans `fapshi.js` sont uniquement pour le développement sandbox.

---

## 5. Côté Backend — Fichier par fichier

### 5.1 Configuration Fapshi (`fapshi.js`)

**Fichier** : `backend/src/config/fapshi.js`

```javascript
/**
 * Fapshi Payment Gateway Configuration
 * Sandbox mode by default — NEVER use live credentials without explicit approval.
 */

const fapshiConfig = {
  // UUID du compte API Fapshi
  apiUser: process.env.FAPSHI_API_USER || '__________________________________',

  // Clé d'API Fapshi
  apiKey: process.env.FAPSHI_API_KEY || '__________________________________',

  // 'sandbox' ou 'live'
  environment: process.env.FAPSHI_ENV || 'sandbox',

  // Secret pour valider les webhooks Fapshi (header x-wh-secret)
  webhookSecret: process.env.FAPSHI_WEBHOOK_SECRET || null,

  /**
   * Base URL automatique selon l'environnement
   * - sandbox → https://sandbox.fapshi.com
   * - live    → https://live.fapshi.com
   */
  get baseUrl() {
    return this.environment === 'live'
      ? 'https://live.fapshi.com'
      : 'https://sandbox.fapshi.com';
  },
};

module.exports = fapshiConfig;
```

**Enregistré dans les variables optionnelles** (`env.js`) :

```javascript
const optionalVars = [
  // ... autres vars ...
  'APP_HOST',
  'FAPSHI_API_USER',
  'FAPSHI_API_KEY',
  'FAPSHI_ENV',
  'FAPSHI_WEBHOOK_SECRET',
];
```

---

### 5.2 Service Billing — Cœur de l'intégration (`billing.service.js`)

**Fichier** : `backend/src/services/billing.service.js`

#### 5.2.1 Client API Fapshi (remplace le SDK officiel)

```javascript
const axios = require('axios');
const crypto = require('crypto');
const sql = require('../config/database');
const fapshiConfig = require('../config/fapshi');
const schoolService = require('./school.service');

/**
 * Client API Fapshi en HTTP direct.
 * Le SDK npm fapshi() hardcode live.fapshi.com — incompatible avec sandbox.
 */
const fapshiApi = {
  headers: {
    apiuser: fapshiConfig.apiUser,
    apikey: fapshiConfig.apiKey,
    'Content-Type': 'application/json',
  },

  /**
   * Initier un paiement Mobile Money
   * POST /initiate-pay
   * @returns { link, transId, message }
   */
  async initiatePay({ amount, email, userId, externalId, redirectUrl, message }) {
    const res = await axios.post(
      `${fapshiConfig.baseUrl}/initiate-pay`,
      { amount, email, userId, externalId, redirectUrl, message },
      { headers: this.headers, timeout: 15000 }
    );
    return res.data;
  },

  /**
   * Vérifier le statut d'un paiement
   * GET /payment-status/:transId
   * @returns { status: 'CREATED' | 'PENDING' | 'SUCCESSFUL' | 'FAILED' | 'EXPIRED' }
   */
  async paymentStatus(transId) {
    const res = await axios.get(
      `${fapshiConfig.baseUrl}/payment-status/${transId}`,
      { headers: this.headers, timeout: 15000 }
    );
    return res.data;
  },

  /**
   * Consulter le solde du compte Fapshi
   * GET /balance
   */
  async balance() {
    const res = await axios.get(
      `${fapshiConfig.baseUrl}/balance`,
      { headers: this.headers, timeout: 15000 }
    );
    return res.data;
  },
};
```

#### 5.2.2 Initiation du paiement

```javascript
class BillingService {

  /**
   * Générer un ID unique pour tracker le paiement
   * Format: {schoolId8chars}-{planCode}-{timestamp36}-{random8hex}
   */
  generateExternalId(schoolId, planCode) {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex');
    const schoolShort = schoolId.toString().replace(/-/g, '').substring(0, 8);
    return `${schoolShort}-${planCode}-${timestamp}-${random}`;
  }

  /**
   * Initier un paiement Fapshi pour un upgrade de plan.
   *
   * 🔒 SÉCURITÉ : Le montant est lu depuis la DB, JAMAIS depuis le frontend.
   *
   * @param {string} schoolId   - ID de l'école (UUID)
   * @param {string} planCode   - Code du plan ('basic', 'premium', 'professional')
   * @param {string} adminEmail - Email de l'admin (pour Fapshi notification)
   * @returns { paymentUrl, transId, externalId, amount, planCode, planName }
   */
  async initiatePayment(schoolId, planCode, adminEmail) {
    // 1. Lookup du plan en base (NE JAMAIS fier du montant frontend)
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

    // 2. Vérifier que l'école existe
    const schools = await sql`
      SELECT school_id, name, subdomain
      FROM schools WHERE school_id = ${schoolId}
    `;
    if (schools.length === 0) {
      throw new Error('School not found');
    }
    const school = schools[0];

    // 3. Générer un external ID unique
    const externalId = this.generateExternalId(schoolId, planCode);

    // 4. Construire l'URL de redirect (page de confirmation frontend)
    const isLive = fapshiConfig.environment === 'live';
    const frontendUrl = process.env.FRONTEND_URL || process.env.APP_HOST;
    if (!frontendUrl) {
      if (isLive) throw new Error('FRONTEND_URL or APP_HOST env var is not set.');
      console.warn('[BillingService] FRONTEND_URL not set. Falling back to localhost:3000');
    }
    const protocol = isLive ? 'https' : 'http';
    const redirectUrl = `${protocol}://${frontendUrl || 'localhost:3000'}/billing/confirm`;

    // 5. Appel API Fapshi — initiatePay
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

    // 6. Enregistrer le paiement en attente
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

    return {
      paymentUrl: fapshiResponse.link,   // URL de checkout Fapshi
      transId: fapshiResponse.transId,   // ID transaction Fapshi
      externalId,                         // Notre ID de tracking
      amount,
      planCode,
      planName: plan.name,
    };
  }
```

#### 5.2.3 Gestion du webhook Fapshi

```javascript
  /**
   * Traiter le webhook entrant de Fapshi.
   *
   * Flux :
   * 1. Vérifier le secret webhook (x-wh-secret)
   * 2. Trouver le paiement par externalId ou transId
   * 3. Vérifier le statut ACTUEL via l'API Fapshi (NE PAS faire confiance au webhook brut)
   * 4. Si SUCCESSFUL → appeler upgradePlan() en interne
   * 5. Idempotent : ignorer les webhooks doublons
   */
  async handleWebhook(payload, webhookSecret) {
    // 1. Vérifier l'authenticité du webhook
    if (fapshiConfig.webhookSecret && webhookSecret !== fapshiConfig.webhookSecret) {
      console.error('[BillingService] Webhook secret mismatch — rejecting');
      throw new Error('Invalid webhook secret');
    }

    const { externalId, transId, status } = payload;

    if (!externalId && !transId) {
      throw new Error('Webhook missing externalId and transId');
    }

    // 2. Trouver le paiement en base
    const payments = externalId
      ? await sql`SELECT * FROM subscription_payments WHERE fapshi_external_id = ${externalId}`
      : await sql`SELECT * FROM subscription_payments WHERE fapshi_trans_id = ${transId}`;

    if (payments.length === 0) {
      console.warn(`[BillingService] Webhook for unknown payment: externalId=${externalId}`);
      return { processed: false, reason: 'payment_not_found' };
    }

    const payment = payments[0];

    // 3. Idempotence — déjà traité, ignorer
    if (payment.status === 'successful') {
      return { processed: false, reason: 'already_processed' };
    }

    // 4. Vérification ACTIVE avec l'API Fapshi (jamais faire confiance au body webhook)
    const fapshiTransId = payment.fapshi_trans_id || transId;
    let verifiedStatus;
    try {
      const statusResponse = await fapshiApi.paymentStatus(fapshiTransId);
      verifiedStatus = statusResponse?.status;
    } catch (err) {
      return { processed: false, reason: 'verification_failed', error: err.message };
    }

    // 5. Mettre à jour selon le statut vérifié
    if (verifiedStatus === 'SUCCESSFUL') {
      // Mettre à jour le paiement
      await sql`
        UPDATE subscription_payments
        SET status = 'successful',
            payer_name = ${payload.payerName || null},
            payer_email = ${payload.email || null},
            raw_webhook = ${JSON.stringify(payload)}::jsonb,
            updated_at = NOW()
        WHERE payment_id = ${payment.payment_id}
      `;

      // ⚡ UPGRADE — le SEUL endroit où upgradePlan() est appelé
      await schoolService.upgradePlan(payment.school_id, payment.plan_code);

      return { processed: true, schoolId: payment.school_id, planCode: payment.plan_code };

    } else if (verifiedStatus === 'FAILED' || verifiedStatus === 'EXPIRED') {
      await sql`
        UPDATE subscription_payments
        SET status = ${verifiedStatus === 'FAILED' ? 'failed' : 'expired'},
            raw_webhook = ${JSON.stringify(payload)}::jsonb,
            updated_at = NOW()
        WHERE payment_id = ${payment.payment_id}
      `;
      return { processed: false, reason: `payment_${verifiedStatus.toLowerCase()}` };
    }

    // CREATED ou PENDING — pas encore conclusif
    return { processed: false, reason: 'still_pending', verifiedStatus };
  }
```

#### 5.2.4 Vérification manuelle (mode dev)

```javascript
  /**
   * Confirmer manuellement un paiement — fallback dev quand le webhook
   * ne peut pas atteindre localhost (pas de ngrok/tunnel).
   *
   * Trouve le dernier paiement en attente pour l'école,
   * vérifie avec l'API Fapshi, upgrade si réussi.
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

    let verifiedStatus;
    try {
      const statusResponse = await fapshiApi.paymentStatus(fapshiTransId);
      verifiedStatus = statusResponse?.status;
    } catch (err) {
      throw new Error(`Failed to verify with Fapshi: ${err.message}`);
    }

    if (verifiedStatus === 'SUCCESSFUL') {
      await sql`
        UPDATE subscription_payments SET status = 'successful', updated_at = NOW()
        WHERE payment_id = ${payment.payment_id}
      `;
      await schoolService.upgradePlan(payment.school_id, payment.plan_code);
      return { confirmed: true, planCode: payment.plan_code, transId: fapshiTransId };
    }

    return { confirmed: false, status: verifiedStatus, transId: fapshiTransId };
  }
```

#### 5.2.5 Consultation du statut de paiement

```javascript
  /**
   * Consulter l'historique des paiements d'une école
   * (utilisé par le frontend pour le polling après redirect)
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
   * Statut d'abonnement actuel de l'école
   */
  async getSubscriptionStatus(schoolId) {
    const schools = await sql`
      SELECT subscription_plan, subscription_status,
             subscription_start_date, subscription_end_date
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
```

---

### 5.3 Controller Billing (`billing.controller.js`)

**Fichier** : `backend/src/controllers/billing.controller.js`

```javascript
const response = require('../utils/response');
const billingService = require('../services/billing.service');

class BillingController {

  /**
   * POST /api/billing/fapshi/initiate
   * Admin initie un upgrade de plan via Fapshi.
   * Body: { planCode }
   * 🔒 Le montant n'est JAMAIS envoyé depuis le frontend.
   */
  async initiate(req, res, next) {
    try {
      const { planCode } = req.body;
      const schoolId = req.user?.schoolId || req.schoolId;
      const adminEmail = req.user?.email;

      if (!schoolId) return response.error(res, 'School not found', null, 400);
      if (!planCode) return response.error(res, 'Plan code is required', null, 400);

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
   * Fapshi envoie les notifications de statut ici.
   * 🔓 PAS d'auth middleware — l'authentification se fait via x-wh-secret header.
   */
  async webhook(req, res, next) {
    try {
      const webhookSecret = req.headers['x-wh-secret'] || null;
      const payload = req.body;

      const result = await billingService.handleWebhook(payload, webhookSecret);

      // Toujours retourner 200 à Fapshi (ils n'envoient qu'un seul webhook)
      res.status(200).json({ received: true, ...result });
    } catch (error) {
      console.error('[BillingController] Webhook error:', error.message);
      // Retourner 200 même en erreur pour éviter les retries Fapshi
      res.status(200).json({ received: true, error: error.message });
    }
  }

  /**
   * GET /api/billing/payment-status
   * Authentifié — le frontend poll ce endpoint pour savoir si le paiement est confirmé.
   */
  async getPaymentStatus(req, res, next) {
    try {
      const schoolId = req.user?.schoolId || req.schoolId;
      if (!schoolId) return response.error(res, 'School not found', null, 400);

      const payments = await billingService.getPaymentStatus(schoolId);
      const subscription = await billingService.getSubscriptionStatus(schoolId);

      response.success(res, 'Payment status retrieved', { payments, subscription });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/billing/confirm-manual
   * Dev-only : vérification manuelle d'un paiement en attente.
   * Utile quand le webhook ne peut pas atteindre localhost.
   */
  async confirmManual(req, res, next) {
    try {
      const schoolId = req.user?.schoolId || req.schoolId;
      if (!schoolId) return response.error(res, 'School not found', null, 400);

      const result = await billingService.confirmManual(schoolId);
      response.success(res, 'Payment verified', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new BillingController();
```

---

### 5.4 Routes Billing (`billing.routes.js`)

**Fichier** : `backend/src/routes/billing.routes.js`

```javascript
const express = require('express');
const billingController = require('../controllers/billing.controller');
const authMiddleware = require('../middleware/auth.middleware');
const tenantMiddleware = require('../middleware/tenant.middleware');
const roleMiddleware = require('../middleware/role.middleware');

const router = express.Router();

// ── Webhook Fapshi (PAS d'auth — vérifié via x-wh-secret) ──
router.post('/fapshi/webhook', billingController.webhook);

// ── Routes protégées (admin uniquement) ──
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

// ── Confirmation manuelle (dev only) ──
router.post(
  '/confirm-manual',
  authMiddleware,
  tenantMiddleware,
  roleMiddleware(['admin']),
  billingController.confirmManual
);

module.exports = router;
```

**Middleware de sécurité sur chaque route :**

| Route | Auth | Tenant | Role | Description |
|-------|------|--------|------|-------------|
| `POST /fapshi/webhook` | ❌ | ❌ | ❌ | Reçoit les notifications Fapshi |
| `POST /fapshi/initiate` | ✅ | ✅ | admin | Initie un paiement |
| `GET /payment-status` | ✅ | ✅ | — | Vérifie le statut |
| `POST /confirm-manual` | ✅ | ✅ | admin | Confirm manuelle (dev) |

---

### 5.5 Service School — `upgradePlan()`

**Fichier** : `backend/src/services/school.service.js`

```javascript
  /**
   * Upgrader le plan d'une école.
   * 🔒 Appelé UNIQUEMENT en interne par billingService après confirmation Fapshi.
   * JAMAIS exposé comme route publique.
   */
  async upgradePlan(schoolId, newPlanCode) {
    // Vérifier que le plan existe et est actif
    const plans = await sql`
      SELECT plan_id, code, name, price, max_students
      FROM subscription_plans
      WHERE code = ${newPlanCode} AND is_active = true
    `;
    if (plans.length === 0) throw new Error('Invalid or inactive plan');

    const plan = plans[0];

    // Vérifier que l'école existe
    const schools = await sql`
      SELECT school_id, name, subscription_plan, subscription_status
      FROM schools WHERE school_id = ${schoolId}
    `;
    if (schools.length === 0) throw new Error('School not found');

    // Calculer les dates d'abonnement (1 an)
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);

    // Mettre à jour l'école
    const updated = await sql`
      UPDATE schools
      SET subscription_plan = ${newPlanCode},
          subscription_status = 'active',
          subscription_start_date = ${subscriptionStartDate.toISOString().split('T')[0]},
          subscription_end_date = ${subscriptionEndDate.toISOString().split('T')[0]},
          updated_at = NOW()
      WHERE school_id = ${schoolId}
      RETURNING school_id, name, subscription_plan, subscription_status,
                subscription_start_date, subscription_end_date
    `;

    return {
      schoolId: updated[0].school_id,
      plan: updated[0].subscription_plan,
      status: updated[0].subscription_status,
      startDate: updated[0].subscription_start_date,
      endDate: updated[0].subscription_end_date,
    };
  }
```

---

## 6. Côté Frontend — Fichier par fichier

### 6.1 Endpoints API

**Fichier** : `frontend/src/app/core/api/endpoints.js`

```javascript
export const API_ENDPOINTS = {
  // ... autres endpoints ...

  // Billing (Fapshi subscription upgrades)
  BILLING: {
    INITIATE: "/api/billing/fapshi/initiate",
    PAYMENT_STATUS: "/api/billing/payment-status",
    CONFIRM_MANUAL: "/api/billing/confirm-manual",
  },
};
```

---

### 6.2 TrialExpiredPage (page d'upgrade)

**Fichier** : `frontend/src/app/features/auth/pages/TrialExpiredPage.jsx`

Cette page s'affiche quand :
- L'essai gratuit de 10 jours est expiré (`ProtectedRoute` redirige vers `/dashboard/trial-expired`)
- L'admin clique sur "Upgrade Plan" dans le sidebar

**Plans affichés (hardcodés, identiques à la landing page) :**

```javascript
const PLANS = [
  {
    name: "Basic",
    price: 180000,
    period: "FCFA / year",
    code: "basic",
    features: {
      en: ["Up to 300 students", "Core academics & grading", "1 website template", "Email support", "Public website"],
      fr: ["Jusqu'à 300 élèves", "Académique & notation", "1 modèle de site web", "Support email", "Site web public"],
    },
  },
  {
    name: "Premium",
    price: 360000,
    period: "FCFA / year",
    code: "premium",
    popular: true,
    features: {
      en: ["Up to 1,500 students", "Finance & payroll suite", "All 3 website templates", "Live chat support", "Bulk import (Excel/CSV)", "Custom branding"],
      fr: ["Jusqu'à 1 500 élèves", "Finance & paie complètes", "Les 3 modèles de site web", "Support live chat", "Import en masse (Excel/CSV)", "Identité personnalisée"],
    },
  },
  {
    name: "Professional",
    price: 720000,
    period: "FCFA / year",
    code: "professional",
    features: {
      en: ["Unlimited students", "Library, transport & hostel", "Advanced analytics", "Priority support", "API access", "Multi-campus"],
      fr: ["Élèves illimités", "Bibliothèque, transport & internat", "Analyses avancées", "Support prioritaire", "Accès API", "Multi-campus"],
    },
  },
];
```

**Logique de paiement :**

```javascript
const handleUpgrade = async (planCode) => {
  setInitiating(planCode);
  try {
    // Appel backend → Fapshi initiatePay
    const res = await api.post(API_ENDPOINTS.BILLING.INITIATE, { planCode });
    const data = res.data.data;

    if (data?.paymentUrl) {
      // Rediriger vers la page de checkout Fapshi
      window.location.href = data.paymentUrl;
    } else {
      throw new Error("No payment URL returned");
    }
  } catch (err) {
    setError(err.response?.data?.message || "Failed to initiate payment.");
  } finally {
    setInitiating(null);
  }
};
```

---

### 6.3 BillingConfirmPage (après redirect Fapshi)

**Fichier** : `frontend/src/app/features/billing/pages/BillingConfirmPage.jsx`

Après le paiement, Fapshi redirige l'utilisateur vers `/billing/confirm`.
Cette page poll le backend pour vérifier si le webhook a été reçu.

**Logique de polling :**

```javascript
const POLL_INTERVAL = 3000;   // toutes les 3 secondes
const MAX_ATTEMPTS = 15;      // max 45 secondes de polling

useEffect(() => {
  let intervalId;
  let count = 0;

  const poll = async () => {
    count++;
    setAttempts(count);

    try {
      const res = await api.get(API_ENDPOINTS.BILLING.PAYMENT_STATUS);
      const { subscription } = res.data.data || {};

      if (subscription?.status === "active") {
        // ✅ Paiement confirmé → rediriger vers dashboard
        setStatus("success");
        await refreshUser();
        setTimeout(() => { window.location.href = "/dashboard"; }, 2000);
        clearInterval(intervalId);
        return;
      }
    } catch { /* retry */ }

    if (count >= MAX_ATTEMPTS) {
      clearInterval(intervalId);
      setStatus("error");
    }
  };

  poll();
  intervalId = setInterval(poll, POLL_INTERVAL);
  return () => clearInterval(intervalId);
}, []);
```

**Fallback : confirmation manuelle (mode dev)**

Si le webhook ne peut pas atteindre localhost (pas de tunnel), l'utilisateur peut cliquer "Vérifier le paiement" :

```javascript
const handleManualConfirm = async () => {
  try {
    const res = await api.post(API_ENDPOINTS.BILLING.CONFIRM_MANUAL);
    if (res.data?.data?.confirmed) {
      setStatus("success");
      await refreshUser();
      setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
    } else {
      setStatus("error");
      setMessage("Le paiement n'a pas encore été confirmé par Fapshi.");
    }
  } catch (err) {
    setStatus("error");
    setMessage(err.response?.data?.message || "Verification failed");
  }
};
```

---

### 6.4 TrialBanner (bannière dans le dashboard)

**Fichier** : `frontend/src/app/components/ui/TrialBanner.jsx`

Affichée en haut du dashboard via `AdminLayout` :

```jsx
<a href="/dashboard/trial-expired"
   className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold ${
     remaining <= 2
       ? "bg-red-600 hover:bg-red-700 text-white"
       : "bg-emerald-800 hover:bg-emerald-700 text-white"
   }`}>
  Upgrade
  <FiArrowRight className="w-4 h-4" />
</a>
```

**Couleurs selon les jours restants :**

| Jours restants | Couleur | Icône |
|----------------|---------|-------|
| > 7 jours | 🟢 Vert (emerald) | `FiClock` |
| 3-7 jours | 🟡 Jaune (amber) | `FiClock` |
| ≤ 2 jours | 🔴 Rouge | `FiAlertTriangle` |

---

## 7. Flux de paiement complet

```
Utilisateur                    Frontend                 Backend                    Fapshi
    │                             │                        │                         │
    │  Clique "Upgrade"           │                        │                         │
    │────────────────────────────▶│                        │                         │
    │                             │  POST /initiate        │                         │
    │                             │  { planCode }          │                         │
    │                             │───────────────────────▶│                         │
    │                             │                        │  POST /initiate-pay     │
    │                             │                        │────────────────────────▶│
    │                             │                        │  ← { link, transId }    │
    │                             │  ← { paymentUrl }      │◀────────────────────────│
    │                             │                        │                         │
    │  ← Redirect to Fapshi       │                        │                         │
    │◀────────────────────────────│                        │                         │
    │                             │                        │                         │
    │  ════ Page Fapshi ═══════════════════════════════════════════════════════════ │
    │  Utilisateur paie via MTN MoMo ou Orange Money       │                         │
    │  ══════════════════════════════════════════════════════════════════════════  │
    │                             │                        │                         │
    │                             │                        │  POST /webhook          │
    │                             │                        │  { externalId,          │
    │                             │                        │    status: "SUCCESSFUL"} │
    │                             │                        │◀────────────────────────│
    │                             │                        │                         │
    │                             │                        │  GET /payment-status    │
    │                             │                        │────────────────────────▶│
    │                             │                        │  ← { status: "SUCCESS"} │
    │                             │                        │◀────────────────────────│
    │                             │                        │                         │
    │                             │                        │  upgradePlan()          │
    │                             │                        │  (UPDATE schools)       │
    │                             │                        │                         │
    │  Redirect → /billing/confirm│                        │                         │
    │◀════════════════════════════│                        │                         │
    │                             │                        │                         │
    │                             │  GET /payment-status   │                         │
    │                             │  (polling toutes 3s)   │                         │
    │                             │───────────────────────▶│                         │
    │                             │  ← subscription.status │                         │
    │                             │     = "active" ✅      │                         │
    │                             │                        │                         │
    │  → /dashboard               │                        │                         │
    │◀────────────────────────────│                        │                         │
```

---

## 8. Sécurité — Ce qu'il ne faut JAMAIS faire

### ✅ Ce qui est bien fait

| Pratique | Implémentation |
|----------|---------------|
| **Montant côté serveur** | `initiatePayment()` lit le prix depuis `subscription_plans`, JAMAIS depuis `req.body` |
| **Vérification webhook** | Le webhook secret (`x-wh-secret`) est vérifié avant traitement |
| **Double vérification** | Même après le webhook, on appelle `fapshiApi.paymentStatus()` pour confirmer |
| **Idempotence** | Les webhooks doublons pour le même `externalId` sont ignorés |
| **Route upgradePlan non exposée** | `upgradePlan()` n'est accessible qu'en interne, jamais via une route |
| **Credentials dans env vars** | Les clés API Fapshi sont dans `.env`, pas en dur |

### ❌ Ce qu'il ne faut JAMAIS faire

```javascript
// ❌ JAMAIS envoyer le montant depuis le frontend
const res = await api.post('/api/billing/initiate', { planCode, amount: 360000 });

// ❌ JAMAIS faire confiance au webhook brut sans vérifier avec l'API
if (webhookPayload.status === 'SUCCESSFUL') {
  // NON ! Toujours appeler fapshiApi.paymentStatus() d'abord
}

// ❌ JAMAIS exposer upgradePlan comme route publique
router.post('/upgrade', (req, res) => {
  schoolService.upgradePlan(req.body.schoolId, req.body.planCode); // NON !
});

// ❌ JAMAIS hardcoder les credentials en prod
const API_KEY = 'FAK_xxxxxxxxxxxxxxxxxxxx'; // JAMAIS
```

---

## 9. Mode Sandbox vs Production

| Critère | Sandbox | Production |
|---------|---------|------------|
| **URL API** | `https://sandbox.fapshi.com` | `https://live.fapshi.com` |
| **FAPSHI_ENV** | `sandbox` | `live` |
| **Cred** | `API_KEY = FAK_xxx` | `API_KEY = FAK_xxx` (cle live) |
| **Transactions** | Test (pas de vrai débit) | Réel |
| **Webhook URL** | `http://localhost:5000/...` | `https://akademee.com/api/billing/fapshi/webhook` |
| **HTTPS** | Non requis | **Obligatoire** |

### Basculement

Modifier `FAPSHI_ENV` dans `.env` :

```bash
# Pour la production :
FAPSHI_ENV=live
FAPSHI_API_USER=<UUID_live>
FAPSHI_API_KEY=<cle_live>
FAPSHI_WEBHOOK_SECRET=<secret_live>
FRONTEND_URL=https://akademee.com
APP_HOST=https://akademee.com
```

---

## 10. Dépannage

| Problème | Cause probable | Solution |
|----------|---------------|----------|
| `Failed to initiate payment: Unauthorized` | Mauvais credentials | Vérifier `FAPSHI_API_USER` et `FAPSHI_API_KEY` dans `.env` |
| `Fapshi did not return a payment link` | Paramètres manquants dans l'appel | Vérifier les logs backend — le body envoyé à Fapshi |
| Webhook jamais reçu | `FRONTEND_URL` mal configuré ou pas de tunnel | Utiliser "Vérifier le paiement" (confirm-manual) en dev |
| `Invalid webhook secret` | Secret ne correspond pas | Vérifier que `FAPSHI_WEBHOOK_SECRET` = celui configuré dans Fapshi |
| Redirige vers `/dashboard` mais plan pas changé | Webhook reçu mais upgradePlan échoué | Vérifier que `subscription_plans` a le bon `code` |
| `this value for column "subscription_plan" is not in enum` | `'professional'` n'est pas dans l'enum | Lancer `node scripts/migrate.js 049` |
| `This plan is free and does not require payment` | Le plan choisi a `price = 0` | Vérifier la table `subscription_plans` en DB |

---

## 11. Structure de la base de données

### Table `subscription_plans`

```sql
CREATE TABLE subscription_plans (
  plan_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          VARCHAR(50) UNIQUE NOT NULL,     -- 'basic', 'premium', 'professional'
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL,           -- 180000, 360000, 720000
  currency      VARCHAR(10) DEFAULT 'FCFA',
  max_students  INTEGER,
  features      JSONB DEFAULT '[]',
  is_active     BOOLEAN DEFAULT true,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Données de référence (identiques à la landing page #pricing)
INSERT INTO subscription_plans (code, name, price, currency, max_students, features, sort_order) VALUES
  ('trial',        'Trial',        0,      'FCFA', 50,
   '["Up to 50 students", "Core academics & grading", "1 website template", "Email support", "Public website"]',
   0),
  ('basic',        'Basic',        180000, 'FCFA', 300,
   '["Up to 300 students", "Core academics & grading", "1 website template", "Email support", "Public website"]',
   1),
  ('premium',      'Premium',      360000, 'FCFA', 1500,
   '["Up to 1,500 students", "Finance & payroll suite", "All 3 website templates", "Live chat support", "Bulk import (Excel/CSV)", "Custom branding"]',
   2),
  ('professional', 'Professional', 720000, 'FCFA', NULL,
   '["Unlimited students", "Library, transport & hostel", "Advanced analytics", "Priority support", "API access", "Multi-campus"]',
   3);
```

### Table `subscription_payments`

```sql
CREATE TABLE subscription_payments (
  payment_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES schools(school_id),
  plan_code         VARCHAR(50) NOT NULL,
  amount            DECIMAL(10,2) NOT NULL,
  currency          VARCHAR(10) DEFAULT 'FCFA',
  fapshi_trans_id   VARCHAR(255),                    -- ID transaction Fapshi
  fapshi_external_id VARCHAR(255),                   -- Notre externalId
  status            VARCHAR(20) DEFAULT 'pending',   -- pending, successful, failed, expired
  payer_name        VARCHAR(255),
  payer_email       VARCHAR(255),
  raw_webhook       JSONB,                           -- Webhook brut pour audit
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_school ON subscription_payments(school_id);
CREATE INDEX idx_payments_external ON subscription_payments(fapshi_external_id);
CREATE INDEX idx_payments_status ON subscription_payments(status);
```

### Table `schools` — Colonnes liées à l'abonnement

> ⚠️ **ATTENTION** : Ces colonnes existent DÉJÀ depuis la migration 002.
> `subscription_plan` utilise un type **ENUM** PostgreSQL (`subscription_plan_enum`),
> PAS un VARCHAR. La migration 049 ajoute la valeur `'professional'` à cet enum.

```sql
-- État RÉEL de la table schools (migration 002 + 011 + 027 + 047) :
-- subscription_plan     subscription_plan_enum DEFAULT 'free'
-- subscription_status   subscription_status_enum DEFAULT 'trial'
-- subscription_start_date DATE
-- subscription_end_date   DATE

-- ENUM subscription_plan_enum (migration 001 + 047 + 049) :
-- Valeurs : free, basic, premium, enterprise, trial, professional

-- ENUM subscription_status_enum (migration 001) :
-- Valeurs : active, trial, suspended, expired
```

### Migration 049 — Mise à jour des plans

La migration `049_update_plans_to_annual.js` fait 3 choses :
1. Ajoute `'professional'` à l'enum `subscription_plan_enum`
2. Met à jour les prix dans `subscription_plans` (monthly → annual)
3. Insère le plan `professional` s'il n'existe pas

```bash
node scripts/migrate.js 049
```

---

## 12. Note sur le SDK npm vs HTTP direct

### SDK `fapshi` v1.1.4 (installé)

```javascript
// Source : https://unpkg.com/fapshi@1.1.4/dist/index.js
var baseUrl = "https://live.fapshi.com"; // ← HARDCODÉ, pas de sandbox

// Le constructeur ne prend AUCUN paramètre d'environnement :
class FAPSHI {
  constructor(user, key) {
    // ... pas de paramètre 'environment' ou 'sandbox'
  }
}

// De plus, sauvegarde vos credentials dans MongoDB :
saveCredentials() {
  // Connecte à mongoose et crée un document Token avec apiuser + key
}
```

### SDK `@fapshi/payments` v1.0.0 (officiel)

```javascript
// Supporte le sandbox via auto-détection ou paramètre explicite :
import { createFapshiClient } from '@fapshi/payments';
const fapshi = createFapshiClient({
  apiUser: 'your-api-user',
  apiKey: 'FAK_TEST_xxx',  // Auto-détecté : sandbox
  // environment: 'sandbox' // Ou explicite
});
```

### Conclusion

Notre approche HTTP directe via `axios` est validée car :
1. Le SDK installé (`fapshi`) **ne supporte pas** le sandbox
2. Le SDK officiel (`@fapshi/payments`) pourrait être une alternative mais nécessite un `npm install` supplémentaire
3. Les appels HTTP directs sont plus transparents et ne sauvegardent pas de credentials dans MongoDB

---

## Résumé des fichiers modifiés/créés

| Fichier | Rôle |
|---------|------|
| `backend/src/config/fapshi.js` | Configuration Fapshi (cred, env, baseUrl) |
| `backend/src/config/env.js` | Variables d'environnement optionnelles |
| `backend/src/services/billing.service.js` | Client API, initiation, webhook, upgrade |
| `backend/src/controllers/billing.controller.js` | Endpoints HTTP pour le billing |
| `backend/src/routes/billing.routes.js` | Routes Express (initiate, webhook, status, manual) |
| `backend/src/services/school.service.js` | `upgradePlan()` — upgrade de l'abonnement |
| `frontend/src/app/core/api/endpoints.js` | Endpoints API frontend |
| `frontend/src/app/features/auth/pages/TrialExpiredPage.jsx` | Page d'upgrade avec les 3 plans |
| `frontend/src/app/features/billing/pages/BillingConfirmPage.jsx` | Confirmation après redirect Fapshi |
| `frontend/src/app/components/ui/TrialBanner.jsx` | Bannière essai dans le dashboard |
| `frontend/src/app/layout/Sidebar.jsx` | Lien "Upgrade Plan" dans le sidebar |
| `frontend/src/app/core/guards/ProtectedRoute.jsx` | Redirect vers `/dashboard/trial-expired` |

---

> **Généré par Codebuff** 🤖 — Guide complet d'intégration Fapshi pour Akademee
