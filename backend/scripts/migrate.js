/**
 * Database Migration Runner
 * Usage: node scripts/migrate.js [migration_number]
 * Examples:
 *   node scripts/migrate.js        - Run all migrations
 *   node scripts/migrate.js 001    - Run specific migration
 *   node scripts/migrate.js reset  - Reset database (drop all tables)
 */

require('dotenv').config();
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL not found in .env file');
  process.exit(1);
}

const sql = postgres(connectionString);

// Get migration number from command line args
const migrationArg = process.argv[2];

async function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, '../src/database/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.js'))
    .sort();
  return files;
}

async function runMigration(migrationFile) {
  try {
    const filePath = path.join(__dirname, '../src/database/migrations', migrationFile);
    const migration = require(filePath);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${migrationFile}`);
    console.log('='.repeat(60));
    
    await migration(sql);
    
    console.log(`✅ ${migrationFile} completed successfully\n`);
    return true;
  } catch (error) {
    console.error(`\n❌ Error in ${migrationFile}:`);
    console.error(error.message);
    console.log();
    return false;
  }
}

async function resetDatabase() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log('⚠️  RESETTING DATABASE - ALL DATA WILL BE LOST');
    console.log('='.repeat(60) + '\n');

    // Drop all tables
    await sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `;

    // Drop all types
    await sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT typname FROM pg_type WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) LOOP
          EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        END LOOP;
      END $$;
    `;

    console.log('✅ Database reset successfully\n');
  } catch (error) {
    console.error('❌ Error resetting database:');
    console.error(error.message);
    process.exit(1);
  }
}

async function main() {
  try {
    // Test connection
    console.log('\n' + '='.repeat(60));
    console.log('DATABASE MIGRATION RUNNER');
    console.log('='.repeat(60));
    
    console.log('\n🔄 Testing database connection...');
    await sql`SELECT 1`;
    console.log('✅ Connected to database\n');

    if (migrationArg === 'reset') {
      await resetDatabase();
      process.exit(0);
    }

    const files = await getMigrationFiles();

    if (!files.length) {
      console.log('❌ No migration files found');
      process.exit(1);
    }

    let migrationsToRun = files;

    if (migrationArg) {
      // Run specific migration
      const specificMigration = files.find(f => f.startsWith(migrationArg));
      if (!specificMigration) {
        console.error(`❌ Migration ${migrationArg} not found`);
        console.log('Available migrations:');
        files.forEach(f => console.log(`  - ${f}`));
        process.exit(1);
      }
      migrationsToRun = [specificMigration];
    }

    // Run migrations
    console.log(`📋 Running ${migrationsToRun.length} migration(s)...\n`);

    let failedCount = 0;
    for (const migrationFile of migrationsToRun) {
      const success = await runMigration(migrationFile);
      if (!success) {
        failedCount++;
        break; // Stop on first failure
      }
    }

    console.log('='.repeat(60));
    if (failedCount === 0) {
      console.log('✨ All migrations completed successfully!');
    } else {
      console.log(`❌ ${failedCount} migration(s) failed`);
    }
    console.log('='.repeat(60) + '\n');

    process.exit(failedCount > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
