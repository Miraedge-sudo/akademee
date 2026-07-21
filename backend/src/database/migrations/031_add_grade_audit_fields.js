/**
 * MIGRATION 031: Add grade audit fields
 * Run: node scripts/migrate.js 031
 *
 * Adds:
 * - previous_score: stores the score before the last modification
 * - updated_at: tracks when the grade was last updated
 */

module.exports = async (sql) => {
  console.log('Adding grade audit fields...\n');

  await sql`
    ALTER TABLE grades
      ADD COLUMN IF NOT EXISTS previous_score NUMERIC,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now()
  `;

  console.log('✅ Added previous_score and updated_at to grades table');

  // Update existing rows to have updated_at = created_at
  await sql`
    UPDATE grades SET updated_at = created_at WHERE updated_at IS NULL
  `;

  console.log('✅ Backfilled updated_at for existing grades\n');
};
