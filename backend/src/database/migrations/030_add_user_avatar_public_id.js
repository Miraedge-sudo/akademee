/**
 * Migration 030: Add user avatar public ID column
 * Description: Supports Cloudinary-backed profile image storage for users.
 */

module.exports = {
  up: async (sql) => {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_public_id TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS idx_users_avatar_public_id ON users(avatar_public_id)`;
  },

  down: async (sql) => {
    await sql`DROP INDEX IF EXISTS idx_users_avatar_public_id`;
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS avatar_public_id`;
  },
};
