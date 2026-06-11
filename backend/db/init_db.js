#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Load .env from project root (backend/.env) so DATABASE_URL is available
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('schema.sql not found at', schemaPath);
      process.exit(1);
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('DATABASE_URL not set. Set it in the environment or .env file.');
      process.exit(1);
    }

    console.log('Trying to run schema with psql (if available)...');
    // Use -d to pass the connection string as the database to connect to
    const psql = spawnSync('psql', ['-d', connectionString, '-f', schemaPath], { stdio: 'inherit' });

    if (psql.error) {
      console.warn('psql not available or failed to start. Falling back to Node Postgres client.');
      await runWithClient(schemaPath);
      process.exit(0);
    }

    if (psql.status !== 0) {
      console.warn('psql returned non-zero exit code. Falling back to Node Postgres client.');
      await runWithClient(schemaPath);
      process.exit(0);
    }
    console.log('Schema applied via psql.');

    // If a seed file exists, attempt to apply it via psql too
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('Applying seed data via psql...');
      const psqlSeed = spawnSync('psql', ['-d', connectionString, '-f', seedPath], { stdio: 'inherit' });
      if (psqlSeed.error || psqlSeed.status !== 0) {
        console.warn('psql seed application failed; falling back to client seed execution.');
        await runWithClient(seedPath);
      } else {
        console.log('Seed applied via psql.');
      }
    }
  } catch (err) {
    console.error('Error applying schema:', err);
    process.exit(1);
  }
})();

async function runWithClient(schemaPath) {
  try {
    // require db client after dotenv so it picks up DATABASE_URL
    const sql = require('../src/config/db');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Executing schema via Postgres client...');
    // Apply statements one-by-one to tolerate existing objects and continue on non-fatal errors
    const statements = schema
      .split(/;\s*\n/) // split on semicolon followed by newline (best-effort)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        if (typeof sql.unsafe === 'function') {
          await sql.unsafe(stmt);
        } else {
          await sql`${stmt}`;
        }
      } catch (err) {
        const msg = err && err.message ? err.message.toLowerCase() : '';
        // Ignore "already exists" errors and continue
        if (msg.includes('already exists') || msg.includes('duplicate') ) {
          console.warn('Warning (ignored):', err.message.split('\n')[0]);
          continue;
        }
        // For other errors, rethrow to stop the init
        throw err;
      }
    }
    console.log('Schema executed via Node Postgres client.');
    // After schema, attempt to run seed.sql if present
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('Executing seed data via Postgres client...');
      const seed = fs.readFileSync(seedPath, 'utf8');
      const seedStatements = seed
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      for (const stmt of seedStatements) {
        try {
          if (typeof sql.unsafe === 'function') {
            await sql.unsafe(stmt);
          } else {
            await sql`${stmt}`;
          }
        } catch (err) {
          const msg = err && err.message ? err.message.toLowerCase() : '';
          if (msg.includes('already exists') || msg.includes('duplicate')) {
            console.warn('Warning (ignored seed):', err.message.split('\n')[0]);
            continue;
          }
          throw err;
        }
      }
      console.log('Seed executed via Node Postgres client.');
    }
  } catch (err) {
    console.error('Failed to run schema via client:', err);
    throw err;
  }
}
