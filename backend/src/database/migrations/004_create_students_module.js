/**
 * MIGRATION 004: Create Students Module
 * Run: node scripts/migrate.js 004
 */

module.exports = async (sql) => {
  console.log('Creating students module tables...\n');

  // Students
  await sql`
    CREATE TABLE IF NOT EXISTS students (
      student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,

      student_number VARCHAR(50),
      registration_number VARCHAR(50),

      date_of_birth DATE,
      gender gender_enum DEFAULT 'male',

      status student_status_enum DEFAULT 'active',

      photo_url TEXT,

      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created students table');

  // Guardians
  await sql`
    CREATE TABLE IF NOT EXISTS guardians (
      guardian_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,

      name VARCHAR(100),
      relationship relationship_enum,
      phone VARCHAR(50),
      email TEXT
    );
  `;
  console.log('✅ Created guardians table');

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_students_school_id ON students(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_students_status ON students(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_guardians_student_id ON guardians(student_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_guardians_school_id ON guardians(school_id)`;
  console.log('✅ Created indexes for students module\n');
};
