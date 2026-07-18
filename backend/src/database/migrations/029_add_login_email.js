/**
 * Migration 029: Add login_email column for role-based authentication
 * Description: Adds login_email column to users table. This stores the role-extended
 * email used for login (e.g. mokomosas.teacher@gmail.com). The original email column
 * stays unchanged for display/records.
 */

module.exports = {
  up: async (sql) => {
    // Add login_email column
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS login_email VARCHAR(255)`;

    // Backfill existing users: login_email = email
    await sql`UPDATE users SET login_email = email WHERE login_email IS NULL`;

    // Create unique index on login_email for active users only
    await sql.unsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_login_email_unique
      ON public.users USING btree (lower(login_email))
      WHERE (login_email IS NOT NULL AND login_email <> '' AND is_active = true)
    `);

    // Add index for login lookup performance
    await sql`CREATE INDEX IF NOT EXISTS idx_users_login_email ON users(lower(login_email))`;
  },

  down: async (sql) => {
    await sql`DROP INDEX IF EXISTS idx_users_login_email_unique`;
    await sql`DROP INDEX IF EXISTS idx_users_login_email`;
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS login_email`;
  },
};
