/**
 * Migration 018: Create announcements table for school communication
 * Run: node scripts/migrate.js 018
 */

module.exports = async (sql) => {
  console.log('Creating announcement types and table...\n');

  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_audience_enum') THEN
        CREATE TYPE announcement_audience_enum AS ENUM ('all', 'teachers', 'students', 'parents');
        RAISE NOTICE 'Created announcement_audience_enum';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'announcement_priority_enum') THEN
        CREATE TYPE announcement_priority_enum AS ENUM ('low', 'normal', 'high');
        RAISE NOTICE 'Created announcement_priority_enum';
      END IF;
    END$$;
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS announcements (
      announcement_id SERIAL PRIMARY KEY,
      school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      target_audience announcement_audience_enum DEFAULT 'all',
      priority announcement_priority_enum DEFAULT 'normal',
      created_by UUID NOT NULL REFERENCES users(user_id),
      is_published BOOLEAN DEFAULT false,
      published_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_announcements_school ON announcements(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published)`;

  console.log('✅ Announcements table created successfully\n');
};
