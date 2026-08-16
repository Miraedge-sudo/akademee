/**
 * MIGRATION 042: Add general_remark column to report_cards
 * Run: node scripts/migrate.js 042
 *
 * `general_remark` stores the automatic "Appréciation générale" derived from
 * the overall average at generation time. Teachers/admins can override it.
 * The teacher can still edit the value afterwards.
 */

module.exports = async (sql) => {
  console.log('Adding general_remark column to report_cards...\n');

  await sql`
    ALTER TABLE report_cards
    ADD COLUMN IF NOT EXISTS general_remark TEXT
  `;

  console.log('✅ Added general_remark column to report_cards\n');
};
