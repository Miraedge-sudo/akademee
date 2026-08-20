require('dotenv').config();
const sql = require('./src/config/database');
const billingService = require('./src/services/billing.service');
const fapshiConfig = require('./src/config/fapshi');
const axios = require('axios');

const SCHOOL_ID = 'd0246443-1c7a-49ff-9087-b2798de38f92';
const PLAN_CODE = 'premium';
const EMAIL = 'admin@palmiers.cm';

(async () => {
  try {
    // ═══════════════════════════════════════════════
    // ETAPE 1: Initier le paiement
    // ═══════════════════════════════════════════════
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  ETAPE 1: Initier le paiement            ║');
    console.log('╚══════════════════════════════════════════╝\n');

    const result = await billingService.initiatePayment(SCHOOL_ID, PLAN_CODE, EMAIL);
    console.log('✅ Payment initiated');
    console.log('   Payment URL:', result.paymentUrl);
    console.log('   Trans ID:', result.transId);
    console.log('   External ID:', result.externalId);
    console.log('   Amount:', result.amount, 'FCFA');
    console.log('   Plan:', result.planName);

    // ═══════════════════════════════════════════════
    // ETAPE 2: Vérifier le record en base
    // ═══════════════════════════════════════════════
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  ETAPE 2: Vérifier le record en base     ║');
    console.log('╚══════════════════════════════════════════╝\n');

    const payments = await sql`SELECT * FROM subscription_payments WHERE fapshi_external_id = ${result.externalId}`;
    const payment = payments[0];
    console.log('✅ Record created in subscription_payments');
    console.log('   status:', payment.status);
    console.log('   fapshi_trans_id:', payment.fapshi_trans_id || 'NULL');
    console.log('   fapshi_external_id:', payment.fapshi_external_id);
    console.log('   amount:', payment.amount);

    // ═══════════════════════════════════════════════
    // ETAPE 3: Simuler le callback (comme si le webhook arrivait)
    // ═══════════════════════════════════════════════
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  ETAPE 3: Vérifier statut Fapshi API     ║');
    console.log('╚══════════════════════════════════════════╝\n');

    const statusRes = await axios.get(
      `${fapshiConfig.baseUrl}/payment-status/${result.transId}`,
      { headers: { apiuser: fapshiConfig.apiUser, apikey: fapshiConfig.apiKey, 'Content-Type': 'application/json' }, timeout: 10000 }
    );
    console.log('✅ Fapshi API status:', statusRes.data.status);
    console.log('   (PENDING is normal - user hasn\'t paid yet)');

    // ═══════════════════════════════════════════════
    // ETAPE 4: Appeler confirmManual (simule le webhook)
    // ═══════════════════════════════════════════════
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  ETAPE 4: Appeler confirmManual          ║');
    console.log('╚══════════════════════════════════════════╝\n');

    const manualResult = await billingService.confirmManual(SCHOOL_ID);
    console.log('Result:', JSON.stringify(manualResult, null, 2));

    if (manualResult.confirmed) {
      console.log('✅ Payment CONFIRMED by Fapshi API');
    } else {
      console.log('⚠️  Payment status:', manualResult.status);
      console.log('   (Normal if user hasn\'t paid on Fapshi yet)');
    }

    // ═══════════════════════════════════════════════
    // ETAPE 5: Vérifier l'état final de l'école
    // ═══════════════════════════════════════════════
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  ETAPE 5: État final de l\'école          ║');
    console.log('╚══════════════════════════════════════════╝\n');

    const school = (await sql`SELECT school_id, name, subscription_plan, subscription_status, subscription_start_date, subscription_end_date FROM schools WHERE school_id = ${SCHOOL_ID}`)[0];
    console.log('   plan:', school.subscription_plan);
    console.log('   status:', school.subscription_status);
    console.log('   start:', school.subscription_start_date);
    console.log('   end:', school.subscription_end_date);

    const lastPayment = (await sql`SELECT plan_code, amount, status, fapshi_trans_id, fapshi_external_id FROM subscription_payments WHERE school_id = ${SCHOOL_ID} ORDER BY created_at DESC LIMIT 1`)[0];
    console.log('   last_payment_code:', lastPayment.plan_code);
    console.log('   last_payment_status:', lastPayment.status);
    console.log('   last_payment_transId:', lastPayment.fapshi_trans_id || 'NULL');

    // ═══════════════════════════════════════════════
    // ETAPE 6: Test d'idempotence
    // ═══════════════════════════════════════════════
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║  ETAPE 6: Test d\'idempotence             ║');
    console.log('╚══════════════════════════════════════════╝\n');

    const beforeCount = (await sql`SELECT COUNT(*)::int as count FROM subscription_payments WHERE school_id = ${SCHOOL_ID}`)[0].count;
    console.log('   Payments before:', beforeCount);

    try {
      const idempotentResult = await billingService.confirmManual(SCHOOL_ID);
      console.log('   Second confirmManual result:', JSON.stringify(idempotentResult));
    } catch(e) {
      console.log('   Second confirmManual error (expected):', e.message);
    }

    const afterCount = (await sql`SELECT COUNT(*)::int as count FROM subscription_payments WHERE school_id = ${SCHOOL_ID}`)[0].count;
    console.log('   Payments after:', afterCount);
    console.log('   Idempotent:', afterCount === beforeCount ? '✅ YES (no duplicate)' : '❌ NO (duplicate created!)');

    const afterSchool = (await sql`SELECT subscription_end_date FROM schools WHERE school_id = ${SCHOOL_ID}`)[0];
    console.log('   End date unchanged:', afterSchool.subscription_end_date?.getTime() === school.subscription_end_date?.getTime() ? '✅ YES' : '❌ NO (date changed)');

    console.log('\n══════════════════════════════════════════');
    console.log('  RAPPORT DE TEST COMPLET');
    console.log('══════════════════════════════════════════\n');

    process.exit(0);
  } catch(e) {
    console.error('FATAL ERROR:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
