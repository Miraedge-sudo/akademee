module.exports = async (sql) => {
  console.log('Adding password reset columns to users table...\n');

  await sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS reset_password_token TEXT,
      ADD COLUMN IF NOT EXISTS reset_password_token_expires_at TIMESTAMP
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_users_reset_password_token
    ON users(reset_password_token)
    WHERE reset_password_token IS NOT NULL
  `;

  console.log('✅ Added reset_password_token and reset_password_token_expires_at columns\n');
};
