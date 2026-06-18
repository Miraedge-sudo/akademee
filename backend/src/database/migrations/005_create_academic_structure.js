/**
 * MIGRATION 005: Create Academic Structure
 * Run: node scripts/migrate.js 005
 */

module.exports = async (sql) => {
  console.log('Creating academic structure tables...\n');

  // Academic Years
  await sql`
    CREATE TABLE IF NOT EXISTS academic_years (
      academic_year_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,

      name VARCHAR(50),
      start_date DATE,
      end_date DATE,

      is_current BOOLEAN DEFAULT FALSE,

      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created academic_years table');

  // Classes
  await sql`
    CREATE TABLE IF NOT EXISTS classes (
      class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,

      name VARCHAR(100),
      academic_year_id UUID REFERENCES academic_years(academic_year_id),

      capacity INT
    );
  `;
  console.log('✅ Created classes table');

  // Subjects
  await sql`
    CREATE TABLE IF NOT EXISTS subjects (
      subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,

      name VARCHAR(100),
      coefficient NUMERIC DEFAULT 1
    );
  `;
  console.log('✅ Created subjects table');

  // Enrollments
  await sql`
    CREATE TABLE IF NOT EXISTS enrollments (
      enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,

      student_id UUID REFERENCES students(student_id),
      class_id UUID REFERENCES classes(class_id),

      academic_year_id UUID REFERENCES academic_years(academic_year_id),

      status TEXT DEFAULT 'active'
    );
  `;
  console.log('✅ Created enrollments table');

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_academic_years_school_id ON academic_years(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_academic_years_is_current ON academic_years(is_current)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_classes_academic_year_id ON classes(academic_year_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_enrollments_school_id ON enrollments(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_enrollments_academic_year_id ON enrollments(academic_year_id)`;
  console.log('✅ Created indexes for academic structure\n');
};
