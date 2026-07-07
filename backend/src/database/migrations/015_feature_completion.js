module.exports = async (sql) => {
  console.log('Adding feature-completion tables (periods, class-subject, subject-teacher, exams, permissions, etc.)...\n');

  // 1. Periods / Terms table
  await sql`
    CREATE TABLE IF NOT EXISTS periods (
      period_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      academic_year_id UUID REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      type period_type_enum NOT NULL DEFAULT 'term',
      start_date DATE,
      end_date DATE,
      is_current BOOLEAN DEFAULT false,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created periods table');

  await sql`CREATE INDEX IF NOT EXISTS idx_periods_school_id ON periods(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_periods_academic_year ON periods(academic_year_id)`;

  // 2. Class-Subject assignments
  await sql`
    CREATE TABLE IF NOT EXISTS class_subjects (
      class_subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      class_id UUID REFERENCES classes(class_id) ON DELETE CASCADE,
      subject_id UUID REFERENCES subjects(subject_id) ON DELETE CASCADE,
      coefficient NUMERIC DEFAULT 1,
      is_compulsory BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT now(),
      UNIQUE(class_id, subject_id)
    );
  `;
  console.log('✅ Created class_subjects table');

  await sql`CREATE INDEX IF NOT EXISTS idx_class_subjects_school ON class_subjects(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_class_subjects_class ON class_subjects(class_id)`;

  // 3. Subject-Teacher assignments
  await sql`
    CREATE TABLE IF NOT EXISTS subject_teachers (
      subject_teacher_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      subject_id UUID REFERENCES subjects(subject_id) ON DELETE CASCADE,
      teacher_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
      class_id UUID REFERENCES classes(class_id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT now(),
      UNIQUE(subject_id, teacher_id, class_id)
    );
  `;
  console.log('✅ Created subject_teachers table');

  await sql`CREATE INDEX IF NOT EXISTS idx_subject_teachers_school ON subject_teachers(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subject_teachers_subject ON subject_teachers(subject_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subject_teachers_teacher ON subject_teachers(teacher_id)`;

  // 4. Add class_teacher_id to classes
  await sql`
    ALTER TABLE classes
      ADD COLUMN IF NOT EXISTS class_teacher_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now()
  `;
  console.log('✅ Added class_teacher_id to classes table');

  await sql`CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(class_teacher_id)`;

  // 5. Exams & Exam Registrations
  await sql`
    CREATE TABLE IF NOT EXISTS exams (
      exam_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      name VARCHAR(200) NOT NULL,
      exam_type VARCHAR(50) NOT NULL,
      academic_year_id UUID REFERENCES academic_years(academic_year_id),
      registration_start DATE,
      registration_end DATE,
      exam_start_date DATE,
      exam_end_date DATE,
      fee NUMERIC DEFAULT 0,
      max_candidates INT,
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created exams table');

  await sql`
    CREATE TABLE IF NOT EXISTS exam_registrations (
      exam_registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      exam_id UUID REFERENCES exams(exam_id) ON DELETE CASCADE,
      student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
      center_id VARCHAR(100),
      registration_number VARCHAR(100),
      status VARCHAR(20) DEFAULT 'registered',
      fee_paid BOOLEAN DEFAULT false,
      result NUMERIC,
      grade VARCHAR(10),
      created_at TIMESTAMP DEFAULT now(),
      UNIQUE(exam_id, student_id)
    );
  `;
  console.log('✅ Created exam_registrations table');

  await sql`CREATE INDEX IF NOT EXISTS idx_exams_school ON exams(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exam_registrations_school ON exam_registrations(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exam_registrations_exam ON exam_registrations(exam_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exam_registrations_student ON exam_registrations(student_id)`;

  // 6. Grade letter conversion config
  await sql`
    CREATE TABLE IF NOT EXISTS grade_scales (
      grade_scale_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      system VARCHAR(50) NOT NULL,
      min_score NUMERIC NOT NULL,
      max_score NUMERIC NOT NULL,
      letter VARCHAR(5) NOT NULL,
      grade_point NUMERIC DEFAULT 0,
      description VARCHAR(100),
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created grade_scales table');

  await sql`CREATE INDEX IF NOT EXISTS idx_grade_scales_school ON grade_scales(school_id)`;

  // Seed default Francophone grade scale
  const existingFranco = await sql`SELECT COUNT(*)::int AS count FROM grade_scales WHERE system = 'francophone'`;
  if (existingFranco[0].count === 0) {
    await sql`
      INSERT INTO grade_scales (system, min_score, max_score, letter, grade_point, description) VALUES
      ('francophone', 16, 20, 'A', 4.0, 'Excellent'),
      ('francophone', 14, 15.99, 'B', 3.5, 'Très bien'),
      ('francophone', 12, 13.99, 'C', 3.0, 'Bien'),
      ('francophone', 10, 11.99, 'D', 2.5, 'Passable'),
      ('francophone', 8, 9.99, 'E', 2.0, 'Insuffisant'),
      ('francophone', 0, 7.99, 'F', 1.0, 'Faible')
    `;
    console.log('✅ Seeded Francophone grade scale');
  }

  const existingAnglo = await sql`SELECT COUNT(*)::int AS count FROM grade_scales WHERE system = 'anglophone'`;
  if (existingAnglo[0].count === 0) {
    await sql`
      INSERT INTO grade_scales (system, min_score, max_score, letter, grade_point, description) VALUES
      ('anglophone', 80, 100, 'A', 4.0, 'Excellent'),
      ('anglophone', 70, 79.99, 'B', 3.0, 'Good'),
      ('anglophone', 60, 69.99, 'C', 2.0, 'Average'),
      ('anglophone', 50, 59.99, 'D', 1.0, 'Below Average'),
      ('anglophone', 40, 49.99, 'E', 0.5, 'Poor'),
      ('anglophone', 0, 39.99, 'F', 0.0, 'Fail')
    `;
    console.log('✅ Seeded Anglophone grade scale');
  }

  // 7. Permissions table
  await sql`
    CREATE TABLE IF NOT EXISTS permissions (
      permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(200) NOT NULL,
      module VARCHAR(100),
      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created permissions table');

  await sql`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_permission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      role_id INT REFERENCES roles(role_id) ON DELETE CASCADE,
      permission_id UUID REFERENCES permissions(permission_id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT now(),
      UNIQUE(role_id, permission_id)
    );
  `;
  console.log('✅ Created role_permissions table');

  // Seed core permissions
  const permCount = await sql`SELECT COUNT(*)::int AS count FROM permissions`;
  if (permCount[0].count === 0) {
    const perms = [
      'students.read', 'students.create', 'students.update', 'students.delete',
      'teachers.read', 'teachers.create', 'teachers.update', 'teachers.delete',
      'classes.read', 'classes.create', 'classes.update', 'classes.delete',
      'subjects.read', 'subjects.create', 'subjects.update', 'subjects.delete',
      'grades.read', 'grades.create', 'grades.update', 'grades.delete',
      'attendance.read', 'attendance.create', 'attendance.update',
      'finance.read', 'finance.create', 'finance.update', 'finance.delete',
      'reports.read', 'reports.export',
      'exams.read', 'exams.create', 'exams.update', 'exams.delete',
      'users.read', 'users.create', 'users.update', 'users.delete',
      'roles.manage', 'permissions.manage',
      'settings.read', 'settings.update',
      'notifications.send',
    ];
    for (const code of perms) {
      const name = code.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      await sql`INSERT INTO permissions (code, name, module) VALUES (${code}, ${name}, ${code.split('.')[0]})`;
    }
    console.log('✅ Seeded default permissions');

    // Assign all permissions to ADMIN role
    const adminRole = await sql`SELECT role_id FROM roles WHERE role_code = 'ADMIN'`;
    if (adminRole.length > 0) {
      const allPerms = await sql`SELECT permission_id FROM permissions`;
      for (const p of allPerms) {
        await sql`INSERT INTO role_permissions (role_id, permission_id) VALUES (${adminRole[0].role_id}, ${p.permission_id}) ON CONFLICT DO NOTHING`;
      }
      console.log('✅ Assigned all permissions to ADMIN role');
    }
  }

  // 8. Enrollment management: add enrollment_number and better tracking
  await sql`
    ALTER TABLE enrollments
      ADD COLUMN IF NOT EXISTS enrollment_number VARCHAR(50),
      ADD COLUMN IF NOT EXISTS enrolled_by UUID REFERENCES users(user_id),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT now()
  `;
  console.log('✅ Extended enrollments table');

  console.log('\n🎉 Feature completion migration 015 applied successfully!\n');
};
