const postgres = require('postgres');
const { URL } = require('url');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not set. Please set it in .env file');
  process.exit(1);
}

let dbName = null;
try {
  const parsed = new URL(connectionString);
  dbName = parsed.pathname ? parsed.pathname.replace(/^\//, '') : null;
} catch (err) {
  // ignore parsing errors; we'll still connect but can't show DB name
}

const sql = postgres(connectionString);

if (dbName) {
  console.log(`Connected to Postgres database: ${dbName}`);
} else {
  console.log('Connected to Postgres (database name not detected in connection string)');
}

// Log all tables on startup (non-blocking)
setTimeout(async () => {
  try {
    // Show current active database
    const dbResult = await sql`SELECT current_database()`;
    console.log(`\n🔗 Current Active Database: ${dbResult[0].current_database}\n`);

    const tables = await sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename ASC
    `;
    if (tables.length > 0) {
      console.log('📋 Database tables:');
      tables.forEach((table, idx) => {
        console.log(`   ${idx + 1}. ${table.tablename}`);
      });
      console.log(`\nTotal: ${tables.length} tables\n`);
    } else {
      console.log('\n⚠️  No tables found in public schema\n');
    }
    // Fetch sample rows for each table (up to 5 rows) and log them
    // try {
    //   const maxRows = 5;
    //   for (const t of tables) {
    //     const name = String(t.tablename).replace(/"/g, '');
    //     try {
    //       const rows = await sql.unsafe(`SELECT * FROM "${name}" LIMIT ${maxRows}`);
    //       // console.log(`\n--- Sample rows from table: ${name} (showing up to ${maxRows}) ---`);
    //       if (rows.length === 0) {
    //         console.log('   (no rows)');
    //         continue;
    //       }
    //       rows.forEach((r, i) => {
    //         console.log(`   [${i + 1}] ` + JSON.stringify(r));
    //       });
    //     } catch (err) {
    //       console.warn(`   Could not read table ${name}:`, err.message.split('\n')[0]);
    //     }
    //   }
    // } catch (err) {
    //   console.warn('Could not fetch sample rows for tables:', err.message.split('\n')[0]);
    // }
  } catch (err) {
    console.warn('⚠️  Unable to list tables (this is optional):', err.message.split('\n')[0]);
  }
}, 500);

module.exports = sql;
