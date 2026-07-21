module.exports = async function up(sql) {
  await sql`
    ALTER TABLE schools
      ADD COLUMN IF NOT EXISTS require_email_verification BOOLEAN DEFAULT FALSE
  `;

  await sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS verification_token TEXT,
      ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS require_email_verification BOOLEAN DEFAULT FALSE
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_users_verification_token
    ON users(verification_token)
    WHERE verification_token IS NOT NULL
  `;

  console.log('✅ Added user email verification fields and verification requirements\n');
};
