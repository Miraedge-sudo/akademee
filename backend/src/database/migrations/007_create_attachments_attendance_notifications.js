/**
 * MIGRATION 007: Create Attachments, Attendance & Notifications
 * Run: node scripts/migrate.js 007
 */

module.exports = async (sql) => {
  console.log('Creating attachments, attendance & notifications tables...\n');

  // Attachments (Cloudinary)
  await sql`
    CREATE TABLE IF NOT EXISTS attachments (
      attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      uploaded_by UUID REFERENCES users(user_id),

      file_name TEXT,
      file_url TEXT,
      public_id TEXT,

      file_type TEXT,

      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created attachments table');

  // Attendance
  await sql`
    CREATE TABLE IF NOT EXISTS attendance (
      attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      student_id UUID REFERENCES students(student_id),

      status attendance_status_enum,
      date DATE,

      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created attendance table');

  // Notifications
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(user_id),

      type notification_type_enum,
      message TEXT,

      is_read BOOLEAN DEFAULT FALSE,

      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created notifications table');

  // Audit Logs
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

      school_id UUID,
      user_id UUID,

      action TEXT,
      table_name TEXT,
      record_id TEXT,

      created_at TIMESTAMP DEFAULT now()
    );
  `;
  console.log('✅ Created audit_logs table');

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_attachments_school_id ON attachments(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON attachments(uploaded_by)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_school_id ON attendance(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_school_id ON notifications(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_school_id ON audit_logs(school_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)`;
  console.log('✅ Created indexes for attachments, attendance & notifications\n');
};
