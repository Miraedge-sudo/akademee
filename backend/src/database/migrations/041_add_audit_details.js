/**
 * MIGRATION 041: Add details column to audit_logs
 * Run: node scripts/migrate.js 041
 *
 * `details` stores a human-readable target label (e.g. the student's name,
 * a payment amount, a class name) so the dashboard "Recent Activities" feed
 * can display richer, real information without extra lookups.
 */

module.exports = async (sql) => {
  console.log('Adding details column to audit_logs...\n');

  await sql`
    ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS details TEXT
  `;

  console.log('✅ Added details column to audit_logs\n');
};
