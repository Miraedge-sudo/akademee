/**
 * MIGRATION 024: Create class_teachers table
 * Run: node scripts/migrate.js 024
 */

module.exports = async (sql) => {
  console.log('Creating class_teachers table...\n');

  await sql`
    CREATE TABLE IF NOT EXISTS class_teachers (
      class_teacher_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      class_id UUID REFERENCES classes(class_id) ON DELETE CASCADE,
      teacher_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
      is_main BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT now(),
      UNIQUE (class_id, teacher_id)
    );
  `;
  console.log('✅ Created class_teachers table');

  await sql`CREATE INDEX IF NOT EXISTS idx_class_teachers_school ON class_teachers(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_class_teachers_class ON class_teachers(class_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_class_teachers_teacher ON class_teachers(teacher_id)`;
  console.log('✅ Created indexes for class_teachers');

  console.log();
};
