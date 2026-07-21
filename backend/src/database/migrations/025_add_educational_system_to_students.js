/**
 * MIGRATION 025: Add educational_system column to students table
 * Run: node scripts/migrate.js 025
 */

module.exports = async (sql) => {
  console.log('Adding educational_system column to students table...\n');

  await sql`
    ALTER TABLE students
      ADD COLUMN IF NOT EXISTS educational_system VARCHAR(100)
  `;
  console.log('✅ Added educational_system column to students table\n');
};
