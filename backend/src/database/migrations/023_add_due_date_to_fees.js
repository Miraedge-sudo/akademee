/**
 * MIGRATION 023: Add due_date column to fees table
 * Run: node scripts/migrate.js 023
 */

module.exports = async (sql) => {
  console.log('Adding due_date column to fees table...\n');

  await sql`
    ALTER TABLE fees
      ADD COLUMN IF NOT EXISTS due_date TIMESTAMP
  `;
  console.log('✅ Added due_date column to fees table');

  console.log();
};
