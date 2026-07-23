/**
 * Migration 034 — Add sequence_id to grades table.
 *
 * Allows grades to be associated with a specific sequence
 * (e.g., "1ère Séquence", "2ème Séquence") instead of only
 * with a period (trimestre/semestre).
 */
module.exports = async function (sql) {
  console.log('[034] Adding sequence_id to grades...');

  await sql`
    ALTER TABLE grades
    ADD COLUMN IF NOT EXISTS sequence_id UUID REFERENCES sequences(sequence_id) ON DELETE SET NULL
  `;

  // Index for faster lookups by sequence
  await sql`
    CREATE INDEX IF NOT EXISTS idx_grades_sequence_id ON grades (sequence_id)
  `;

  console.log('[034] Done — sequence_id column added to grades table.');
};
