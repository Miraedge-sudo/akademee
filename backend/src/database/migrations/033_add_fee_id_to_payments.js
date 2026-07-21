/**
 * MIGRATION 033: Add fee_id column to payments table
 *
 * The payments table was created in migration 006 without a fee_id column.
 * This column is needed to link payments to specific fees.
 * Run: node scripts/migrate.js 033
 */

module.exports = async (sql) => {
  console.log('Adding fee_id to payments table...\n');

  await sql`
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS fee_id UUID REFERENCES fees(fee_id) ON DELETE SET NULL;
  `;
  console.log('✅ Added fee_id to payments table');

  await sql`CREATE INDEX IF NOT EXISTS idx_payments_fee_id ON payments(fee_id)`;
  console.log('✅ Created index on payments(fee_id)\n');
};
