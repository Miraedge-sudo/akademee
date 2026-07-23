/**
 * Migration 037 — Add education_system_code to report_cards table.
 *
 * This stores the education system code (e.g., 'FR_GEN', 'ANG_GEN', etc.)
 * selected by the admin during report card generation, so the bulletin
 * template renders with the correct education system config.
 *
 * Previously, the education system was inferred from the student's class
 * linkage, which made the frontend system selection ineffective.
 */
module.exports = async (sql) => {
  console.log('[037] Adding education_system_code to report_cards...');

  await sql`
    ALTER TABLE report_cards
      ADD COLUMN IF NOT EXISTS education_system_code VARCHAR(20)
  `;

  console.log('[037] Done — education_system_code column added to report_cards table.');
};
