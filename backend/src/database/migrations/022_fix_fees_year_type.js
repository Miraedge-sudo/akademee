/**
 * MIGRATION 022: Fix fees academic_year_id type from INTEGER to UUID
 * Run: node scripts/migrate.js 022
 */

module.exports = async (sql) => {
  console.log('Fixing fees academic_year_id type...\n');

  await sql`ALTER TABLE fees DROP COLUMN IF EXISTS academic_year_id`;
  await sql`ALTER TABLE fees ADD COLUMN academic_year_id UUID REFERENCES academic_years(academic_year_id) ON DELETE SET NULL`;
  console.log('Fixed fees.academic_year_id (INTEGER -> UUID)');

  await sql`
    DO $$ BEGIN
      IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'student_fees') THEN
        ALTER TABLE student_fees DROP COLUMN IF EXISTS academic_year_id;
        ALTER TABLE student_fees ADD COLUMN academic_year_id UUID REFERENCES academic_years(academic_year_id) ON DELETE SET NULL;
      END IF;
    END $$;
  `;
  console.log('Fixed student_fees.academic_year_id (INTEGER -> UUID)');

  console.log();
};
