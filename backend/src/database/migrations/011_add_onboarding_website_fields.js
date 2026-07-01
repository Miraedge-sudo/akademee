module.exports = async (sql) => {
  console.log('Adding missing onboarding website fields to schools table...\n');

  await sql`
    ALTER TABLE schools
      ADD COLUMN IF NOT EXISTS hero_image_url_2 TEXT,
      ADD COLUMN IF NOT EXISTS exam_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS exam_pass_rate VARCHAR(10),
      ADD COLUMN IF NOT EXISTS ranking VARCHAR(50),
      ADD COLUMN IF NOT EXISTS ranking_city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS about_photos JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS classes_config JSONB DEFAULT '{}'::jsonb
  `;

  console.log('✅ Added hero_image_url_2, exam_type, exam_pass_rate, ranking, ranking_city, about_photos, classes_config columns\n');
};
