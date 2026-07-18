/**
 * Migration 027: Add user profile fields
 * Description: Adds gender, date_of_birth, and nationality columns to users table
 */

module.exports = {
  up: async (sql) => {
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20)`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality VARCHAR(100)`;
  },

  down: async (sql) => {
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS gender`;
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS date_of_birth`;
    await sql`ALTER TABLE users DROP COLUMN IF EXISTS nationality`;
  },
};
