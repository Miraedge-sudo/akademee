/**
 * Migration 019: Add performance indexes for common query patterns
 *
 * Adds missing FK indexes, WHERE-clause indexes, and composite indexes
 * identified by schema audit as P0 (critical) and P1 (high) priority.
 *
 * NOTE: student_fees table uses INTEGER FKs referencing UUID PKs — that
 * type mismatch prevents index creation. Fix separately if needed.
 */
module.exports = async (sql) => {
  await sql`
    ALTER TABLE students
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
  `;

  await sql`
    UPDATE students
    SET updated_at = COALESCE(updated_at, created_at, NOW())
    WHERE updated_at IS NULL
  `;

  // === P0: FOREIGN KEY INDEXES ===
  await sql`CREATE INDEX IF NOT EXISTS idx_fees_academic_year_id ON fees(academic_year_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_marked_by ON attendance(marked_by)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance(class_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exams_academic_year_id ON exams(academic_year_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_subject_teachers_class_id ON subject_teachers(class_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON class_subjects(subject_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_by ON enrollments(enrolled_by)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON announcements(created_by)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_grades_period_id ON grades(period_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_schools_website_template_id ON schools(website_template_id)`;

  // === P1: WHERE-CLAUSE INDEXES ===
  await sql`CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_fees_is_active ON fees(is_active)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_fees_due_date ON fees(due_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_schools_is_active ON schools(is_active)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_periods_type ON periods(type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_periods_is_current ON periods(is_current)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exam_registrations_status ON exam_registrations(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exam_registrations_fee_paid ON exam_registrations(fee_paid)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_school_media_media_type ON school_media(media_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_schools_subscription_plan ON schools(subscription_plan)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_schools_subscription_status ON schools(subscription_status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_exams_exam_type ON exams(exam_type)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_announcements_target_audience ON announcements(target_audience)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_announcements_priority ON announcements(priority)`;

  // === P2: COMPOSITE INDEXES ===
  // Attendance: daily reports per student/class
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_school_student_date ON attendance(school_id, student_id, date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_school_class_date ON attendance(school_id, class_id, date)`;

  // Grades: report cards and transcripts
  await sql`CREATE INDEX IF NOT EXISTS idx_grades_school_student_period ON grades(school_id, student_id, period_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_grades_school_student_subject ON grades(school_id, student_id, subject_id)`;

  // Enrollments: class roster and history
  await sql`CREATE INDEX IF NOT EXISTS idx_enrollments_school_class_year ON enrollments(school_id, class_id, academic_year_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_enrollments_school_student_year ON enrollments(school_id, student_id, academic_year_id)`;

  // Payments: reconciliation and reporting
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_school_student_status ON payments(school_id, student_id, status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_payments_school_created_at ON payments(school_id, created_at)`;

  // Notifications: unread count feed
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_school_user_read ON notifications(school_id, user_id, is_read)`;

  // Periods: current period lookup
  await sql`CREATE INDEX IF NOT EXISTS idx_periods_school_year_current ON periods(school_id, academic_year_id, is_current)`;

  // Exams: filtered by type and year
  await sql`CREATE INDEX IF NOT EXISTS idx_exams_school_type_year ON exams(school_id, exam_type, academic_year_id)`;

  // Fees: active fees per class
  await sql`CREATE INDEX IF NOT EXISTS idx_fees_school_class_active ON fees(school_id, class_id, is_active)`;
};

module.exports.down = async (sql) => {
  const indexes = [
    'fees_academic_year_id',
    'attendance_marked_by',
    'attendance_class_id',
    'role_permissions_role_id',
    'role_permissions_permission_id',
    'exams_academic_year_id',
    'subject_teachers_class_id',
    'class_subjects_subject_id',
    'enrollments_enrolled_by',
    'announcements_created_by',
    'grades_period_id',
    'schools_website_template_id',
    'enrollments_status',
    'fees_is_active',
    'fees_due_date',
    'schools_is_active',
    'users_is_active',
    'attendance_status',
    'notifications_type',
    'periods_type',
    'periods_is_current',
    'exam_registrations_status',
    'exam_registrations_fee_paid',
    'school_media_media_type',
    'schools_subscription_plan',
    'schools_subscription_status',
    'exams_exam_type',
    'announcements_target_audience',
    'announcements_priority',
    'attendance_school_student_date',
    'attendance_school_class_date',
    'grades_school_student_period',
    'grades_school_student_subject',
    'enrollments_school_class_year',
    'enrollments_school_student_year',
    'payments_school_student_status',
    'payments_school_created_at',
    'notifications_school_user_read',
    'periods_school_year_current',
    'exams_school_type_year',
    'fees_school_class_active',
  ];
  for (const idx of indexes) {
    await sql`DROP INDEX IF EXISTS ${sql(idx)}`;
  }

  await sql`
    ALTER TABLE students
    DROP COLUMN IF EXISTS updated_at
  `;
};
