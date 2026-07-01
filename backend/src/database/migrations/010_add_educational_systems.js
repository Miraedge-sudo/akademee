module.exports = async (sql) => {
  console.log('Adding educational_systems column to schools table...\n');

  await sql`
    ALTER TABLE schools
      ADD COLUMN IF NOT EXISTS educational_systems JSONB DEFAULT '[]'::jsonb
  `;
  console.log('✅ Added educational_systems column to schools table\n');
};
