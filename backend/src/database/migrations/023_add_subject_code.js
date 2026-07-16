/**
 * MIGRATION 023: Add code column to subjects table
 * Run: node scripts/migrate.js 023
 */

module.exports = async (sql) => {
  console.log('Adding code column to subjects table...\n');

  await sql`
    ALTER TABLE subjects ADD COLUMN IF NOT EXISTS code VARCHAR(10)
  `;
  console.log('✅ Added subjects.code column (VARCHAR(10))');

  // Auto-generate codes for existing subjects that have none
  const result = await sql`
    UPDATE subjects 
    SET code = UPPER(LEFT(TRIM(name), 3))
    WHERE code IS NULL AND name IS NOT NULL AND TRIM(name) != ''
  `;
  console.log(`✅ Auto-generated codes for ${result.count || 0} existing subjects`);

  console.log();
};
