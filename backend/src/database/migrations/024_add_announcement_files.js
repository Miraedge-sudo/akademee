module.exports = async (sql) => {
  console.log('Adding files column to announcements table...\n');

  await sql`
    ALTER TABLE announcements
      ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb
  `;
  console.log('Added files column to announcements table\n');
};
