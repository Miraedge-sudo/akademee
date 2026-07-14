/**
 * MIGRATION 021: Add academic_year_id to attendance and payments
 * Run: node scripts/migrate.js 021
 */

module.exports = async (sql) => {
  console.log('Adding academic_year_id to attendance...\n');

  await sql`
    ALTER TABLE attendance ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(academic_year_id) ON DELETE SET NULL;
  `;
  console.log('✅ Added academic_year_id to attendance');

  await sql`
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES academic_years(academic_year_id) ON DELETE SET NULL;
  `;
  console.log('✅ Added academic_year_id to payments');

  await sql`DROP INDEX IF EXISTS idx_attendance_year`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_year ON attendance(academic_year_id)`;
  console.log('✅ Created index on attendance(academic_year_id)');

  await sql`DROP INDEX IF EXISTS idx_payments_year`;
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_year ON payments(academic_year_id)`;
  console.log('✅ Created index on payments(academic_year_id)\n');
};
