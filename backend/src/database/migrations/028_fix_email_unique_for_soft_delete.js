/**
 * Migration 028: Fix email unique constraint to allow soft-deleted users to reuse emails
 * Description: Drops the existing unique email index and recreates it with is_active = true
 */

module.exports = {
  up: async (sql) => {
    // Drop the existing partial unique index
    await sql`DROP INDEX IF EXISTS idx_users_email_unique`;

    // Create a new unique index that only enforces uniqueness for active users
    await sql.unsafe(`
      CREATE UNIQUE INDEX idx_users_email_unique
      ON public.users USING btree (lower(email))
      WHERE (email IS NOT NULL AND email <> '' AND is_active = true)
    `);
  },

  down: async (sql) => {
    await sql`DROP INDEX IF EXISTS idx_users_email_unique`;

    // Restore original index (without is_active filter)
    await sql.unsafe(`
      CREATE UNIQUE INDEX idx_users_email_unique
      ON public.users USING btree (lower(email))
      WHERE (email IS NOT NULL AND email <> '')
    `);
  },
};
