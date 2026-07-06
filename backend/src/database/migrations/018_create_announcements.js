/**
 * Migration 018: Create announcements table for school communication
 */
exports.up = async (sql) => {
  await sql`CREATE TYPE IF NOT EXISTS announcement_audience_enum AS ENUM ('all', 'teachers', 'students', 'parents')`;
  await sql`CREATE TYPE IF NOT EXISTS announcement_priority_enum AS ENUM ('low', 'normal', 'high')`;

  await sql`
    CREATE TABLE IF NOT EXISTS announcements (
      announcement_id SERIAL PRIMARY KEY,
      school_id INTEGER NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      target_audience announcement_audience_enum DEFAULT 'all',
      priority announcement_priority_enum DEFAULT 'normal',
      created_by INTEGER NOT NULL REFERENCES users(user_id),
      is_published BOOLEAN DEFAULT false,
      published_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_announcements_school ON announcements(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published)`;
};

exports.down = async (sql) => {
  await sql`DROP TABLE IF EXISTS announcements`;
  await sql`DROP TYPE IF EXISTS announcement_audience_enum`;
  await sql`DROP TYPE IF EXISTS announcement_priority_enum`;
};
