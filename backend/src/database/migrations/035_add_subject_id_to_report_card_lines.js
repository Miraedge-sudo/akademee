/**
 * Migration 035: Add subject_id to report_card_lines
 *
 * Allows the report card generation to fall back to the old grading system
 * (grades table with subject_id + period_id) when no subject_offerings or
 * assessment_components are configured.
 */
module.exports = {
  name: '035_add_subject_id_to_report_card_lines',
  up: async (sql) => {
    await sql`
      ALTER TABLE report_card_lines
      ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(subject_id) ON DELETE SET NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_report_card_lines_subject_id
      ON report_card_lines(subject_id)
    `;
    console.log('  ✓ subject_id column added to report_card_lines');
  },
  down: async (sql) => {
    await sql`DROP INDEX IF EXISTS idx_report_card_lines_subject_id`;
    await sql`ALTER TABLE report_card_lines DROP COLUMN IF EXISTS subject_id`;
  },
};
