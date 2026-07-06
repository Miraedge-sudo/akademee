module.exports = async (sql) => {
  console.log('Creating grades table and extending fees table...\n');

  // Grades table
  await sql`
    CREATE TABLE IF NOT EXISTS grades (
      grade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
      subject_id UUID REFERENCES subjects(subject_id) ON DELETE SET NULL,
      period_id UUID,
      score NUMERIC NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created grades table');

  await sql`CREATE INDEX IF NOT EXISTS idx_grades_school_id ON grades(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_grades_subject_id ON grades(subject_id)`;
  console.log('✅ Created indexes for grades table');

  // Extend fees table
  await sql`
    ALTER TABLE fees
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(class_id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT now()
  `;
  console.log('✅ Extended fees table with description, class_id, created_at');

  await sql`CREATE INDEX IF NOT EXISTS idx_fees_class_id ON fees(class_id)`;
  console.log('✅ Created index for fees.class_id\n');
};
