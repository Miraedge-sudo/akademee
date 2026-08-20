require('dotenv').config();
const sql = require('./src/config/database');
(async () => {
  try {
    const schools = await sql`SELECT school_id, name, subdomain, subscription_plan, subscription_status, subscription_start_date, subscription_end_date FROM schools WHERE name ILIKE '%palmiers%'`;
    if (schools.length === 0) { console.log('No school found'); process.exit(1); }
    const s = schools[0];
    console.log('=== ECOLE DE TEST ===');
    console.log('school_id:', s.school_id);
    console.log('name:', s.name);
    console.log('subdomain:', s.subdomain);
    console.log('plan:', s.subscription_plan);
    console.log('status:', s.subscription_status);
    console.log('start:', s.subscription_start_date);
    console.log('end:', s.subscription_end_date);
    console.log('');

    const payments = await sql`SELECT payment_id, plan_code, amount, status, fapshi_trans_id, created_at FROM subscription_payments WHERE school_id = ${s.school_id} ORDER BY created_at DESC LIMIT 5`;
    console.log('=== PAIEMENTS EXISTANTS ===');
    if (payments.length === 0) console.log('Aucun paiement');
    payments.forEach(p => console.log(' ', p.plan_code, p.amount, p.status, p.fapshi_trans_id || 'NULL'));
  } catch(e) {
    console.error('ERROR:', e.message);
  }
  process.exit(0);
})();
