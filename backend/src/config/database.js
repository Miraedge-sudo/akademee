/**
 * Supabase PostgreSQL connection (via DATABASE_URL)
 * Uses the `postgres` driver for direct SQL — not @supabase/supabase-js
 */

const postgres = require('postgres');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'Missing DATABASE_URL in .env — use your Supabase PostgreSQL connection string'
  );
}

const sql = postgres(connectionString, {
  prepare: false,
  ssl: process.env.DATABASE_SSL === 'true' ? 'require' : undefined,
});

module.exports = sql;
