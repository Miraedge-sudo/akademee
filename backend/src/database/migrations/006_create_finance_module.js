/**
 * MIGRATION 006: Create Finance Module
 * Run: node scripts/migrate.js 006
 */

module.exports = async (sql) => {
  console.log('Creating finance module tables...\n');

  // Fees
  await sql`
    CREATE TABLE IF NOT EXISTS fees (
      fee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,

      name VARCHAR(100),
      amount NUMERIC
    );
  `;
  console.log('✅ Created fees table');

  // Payments
  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,

      student_id UUID REFERENCES students(student_id),

      amount NUMERIC,
      method payment_method_enum,

      status payment_status_enum DEFAULT 'pending',

      receipt_number TEXT UNIQUE,

      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created payments table');

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_fees_school_id ON fees(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_school_id ON payments(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)`;
  console.log('✅ Created indexes for finance module\n');
};
