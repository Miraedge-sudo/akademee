/**
 * MIGRATION 025: Add level and series columns to subjects table
 * Run: node scripts/migrate.js 025
 */

module.exports = async (sql) => {
  console.log('Adding level and series columns to subjects table...\n');

  await sql`
    ALTER TABLE subjects ADD COLUMN IF NOT EXISTS level VARCHAR(100)
  `;
  console.log('✅ Added subjects.level column (VARCHAR(100))');

  await sql`
    ALTER TABLE subjects ADD COLUMN IF NOT EXISTS series VARCHAR(100)
  `;
  console.log('✅ Added subjects.series column (VARCHAR(100))');

  console.log();
};
