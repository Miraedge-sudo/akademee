/**
 * Database Connection Test Script
 */

require('dotenv').config();
const sql = require('../src/config/database');

async function testConnection() {
  console.log('\n' + '='.repeat(60));
  console.log('  SUPABASE POSTGRESQL CONNECTION TEST');
  console.log('='.repeat(60) + '\n');

  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL not found in .env file');
    process.exit(1);
  }

  try {
    const result = await sql`SELECT 1 as connection_test`;

    if (result[0]?.connection_test === 1) {
      console.log('CONNECTION SUCCESSFUL\n');
    }

    const dbName = await sql`SELECT current_database()`;
    console.log('Database Name:', dbName[0]?.current_database || 'unknown');

    const version = await sql`SELECT version()`;
    console.log('Database Version:', version[0]?.version?.split(',')[0] || 'unknown');

    const tables = await sql`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log('Total Tables:', tables[0]?.table_count || 0);

    console.log('\n' + '='.repeat(60));
    console.log('All checks passed!');
    console.log('='.repeat(60) + '\n');

    await sql.end();
  } catch (error) {
    console.error('\nCONNECTION FAILED');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testConnection();
