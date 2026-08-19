/**
 * MIGRATION 048: Create subscription_payments table for Fapshi billing
 * Run: node scripts/migrate.js 048
 */

module.exports = async (sql) => {
  console.log('Creating subscription_payments table...\n');

  await sql`
    CREATE TABLE IF NOT EXISTS subscription_payments (
      payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
      plan_code VARCHAR(50) NOT NULL,
      amount INTEGER NOT NULL,
      currency VARCHAR(10) DEFAULT 'FCFA',
      fapshi_trans_id VARCHAR(100),
      fapshi_external_id VARCHAR(100) UNIQUE NOT NULL,
      status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'successful', 'failed', 'expired')),
      payer_email VARCHAR(255),
      payer_name VARCHAR(255),
      raw_webhook JSONB,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `;
  console.log('✅ Created subscription_payments table');

  await sql`CREATE INDEX IF NOT EXISTS idx_subscription_payments_school ON subscription_payments(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subscription_payments_external ON subscription_payments(fapshi_external_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subscription_payments_status ON subscription_payments(status)`;
  console.log('✅ Created indexes for subscription_payments\n');

  console.log('✅ Migration 048 complete\n');
};
