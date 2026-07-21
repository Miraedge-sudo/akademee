/**
 * MIGRATION 032: Make fees.amount NOT NULL
 * Run: node scripts/migrate.js 032
 *
 * Ensures fees have a valid amount, preventing NULL insertion errors
 * in student_fees.amount_due which is DECIMAL(10,2) NOT NULL.
 */

module.exports = async (sql) => {
  console.log('Fixing fees.amount to be NOT NULL...\n');

  // Fix any fees with NULL amount by setting them to 0
  await sql`
    UPDATE fees SET amount = 0 WHERE amount IS NULL
  `;
  console.log('✅ Set NULL amounts to 0');

  // Add NOT NULL constraint
  await sql`
    ALTER TABLE fees ALTER COLUMN amount SET NOT NULL
  `;
  console.log('✅ Added NOT NULL constraint to fees.amount\n');
};
