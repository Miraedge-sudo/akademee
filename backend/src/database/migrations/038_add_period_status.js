/**
 * MIGRATION 038: Add status & updated_at columns to periods table
 * Run: node scripts/migrate.js 038
 */

module.exports = async (sql) => {
  console.log('Adding status and updated_at columns to periods table...\n');

  await sql`
    ALTER TABLE periods
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'EN_ATTENTE'
      CHECK (status IN ('EN_ATTENTE', 'OUVERTE', 'FERMEE', 'VERROUILLEE'))
  `;
  console.log('✅ Added status column to periods table');

  await sql`
    ALTER TABLE periods
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now()
  `;
  console.log('✅ Added updated_at column to periods table');

  // Backfill existing periods with auto-calculated status
  await sql`
    UPDATE periods SET status =
      CASE
        WHEN end_date < CURRENT_DATE THEN 'FERMEE'
        WHEN start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE THEN 'OUVERTE'
        ELSE 'EN_ATTENTE'
      END
    WHERE status IS NULL OR status = 'EN_ATTENTE'
  `;
  console.log('✅ Backfilled status for existing periods\n');
};
