/**
 * MIGRATION 008: School verification, onboarding content, student class label
 * Adds columns for email verification, website onboarding data, and student display fields.
 * Run: node scripts/migrate.js 008
 */

module.exports = async (sql) => {
  console.log('Adding onboarding, verification, and student extension columns...\n');

  // School email verification + website onboarding fields (tenant-scoped per school row)
  await sql`
    ALTER TABLE schools
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verification_token TEXT,
      ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS website_description TEXT,
      ADD COLUMN IF NOT EXISTS year_founded VARCHAR(4),
      ADD COLUMN IF NOT EXISTS website_stats JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS website_values JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS website_published BOOLEAN DEFAULT FALSE
  `;
  console.log('✅ Extended schools table with verification and onboarding columns');

  // Optional class label on students for UI until full class enrollment is wired
  await sql`
    ALTER TABLE students
      ADD COLUMN IF NOT EXISTS class_label VARCHAR(100),
      ADD COLUMN IF NOT EXISTS fee_status VARCHAR(20) DEFAULT 'pending'
  `;
  console.log('✅ Extended students table with class_label and fee_status');

  await sql`
    CREATE INDEX IF NOT EXISTS idx_schools_verification_token ON schools(verification_token)
    WHERE verification_token IS NOT NULL
  `;
  console.log('✅ Created verification token index\n');
};
