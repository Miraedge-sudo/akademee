/**
 * Migration 039: Composite performance indexes for the hottest read paths.
 *
 * The dashboard, finance and attendance modules run many COUNT(*) / SUM()
 * queries that filter by school_id + status (+ academic_year_id / created_at).
 * Single-column indexes force the planner to combine several indexes or scan.
 * These composite indexes make those aggregations index-only lookups.
 *
 * All indexes are CREATE INDEX IF NOT EXISTS — safe to re-run.
 */
module.exports = {
  name: '039_add_composite_perf_indexes',
  up: async (sql) => {
    console.log('  ↳ Creating composite performance indexes…');

    // Dashboard: student counts per school + status
    await sql`
      CREATE INDEX IF NOT EXISTS idx_students_school_status
      ON students (school_id, status)
    `;

    // Dashboard: active users per school
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_school_active
      ON users (school_id, is_active)
    `;

    // Finance: SUM(amount) WHERE school_id + status='completed'
    //   + academic_year_id filter + created_at fallback (last N months)
    // Note: (school_id, status) alone is a left-prefix of the two 3-column
    // indexes below — it would add write overhead with no planner benefit.
    await sql`
      CREATE INDEX IF NOT EXISTS idx_payments_school_status_year
      ON payments (school_id, status, academic_year_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_payments_school_status_created
      ON payments (school_id, status, created_at)
    `;

    // Student fees: per-student fee aggregation + per-school status grouping
    await sql`
      CREATE INDEX IF NOT EXISTS idx_student_fees_school_student
      ON student_fees (school_id, student_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_student_fees_school_status
      ON student_fees (school_id, status)
    `;

    // Enrollments: active class lists + student ↔ class lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_enrollments_school_class_status
      ON enrollments (school_id, class_id, status)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_enrollments_student_class_status
      ON enrollments (student_id, class_id, status)
    `;
    // Per-class active student counts (correlated COUNT(*) on every class list
    // page): WHERE class_id = X AND status = 'active' — no school_id filter.
    await sql`
      CREATE INDEX IF NOT EXISTS idx_enrollments_class_status
      ON enrollments (class_id, status)
    `;

    // Grades: per-student / per-period aggregations
    await sql`
      CREATE INDEX IF NOT EXISTS idx_grades_school_student
      ON grades (school_id, student_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_grades_student_period
      ON grades (student_id, period_id)
    `;

    // Report cards: bulletin generation & lookups per student+period+sequence
    await sql`
      CREATE INDEX IF NOT EXISTS idx_report_cards_student_period_seq
      ON report_cards (student_id, period_structure_id, sequence_id)
    `;

    // Attendance: per-student status counts + per-class daily rollup
    await sql`
      CREATE INDEX IF NOT EXISTS idx_attendance_school_student_status
      ON attendance (school_id, student_id, status)
    `;
    // (school_id, class_id, date) already exists via migration 019 —
    // not re-created here so rollback never drops another migration's index.

    // Academic years: current-year resolution per school
    await sql`
      CREATE INDEX IF NOT EXISTS idx_academic_years_school_current
      ON academic_years (school_id, is_current)
    `;

    // Announcements & media gallery: common public vitrine queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_announcements_school_published
      ON announcements (school_id, is_published)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_announcements_school_created
      ON announcements (school_id, created_at)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_school_media_school_type
      ON school_media (school_id, media_type)
    `;

    // Notifications: unread badge queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_school_read
      ON notifications (user_id, school_id, is_read)
    `;

    console.log('  ✓ Composite performance indexes created');
  },
  down: async (sql) => {
    console.log('  ↳ Dropping composite performance indexes…');

    // Names are inlined (not parameterized): DDL does not accept bind params.
    await sql`DROP INDEX IF EXISTS idx_students_school_status`;
    await sql`DROP INDEX IF EXISTS idx_users_school_active`;
    await sql`DROP INDEX IF EXISTS idx_payments_school_status_year`;
    await sql`DROP INDEX IF EXISTS idx_payments_school_status_created`;
    await sql`DROP INDEX IF EXISTS idx_student_fees_school_student`;
    await sql`DROP INDEX IF EXISTS idx_student_fees_school_status`;
    await sql`DROP INDEX IF EXISTS idx_enrollments_school_class_status`;
    await sql`DROP INDEX IF EXISTS idx_enrollments_student_class_status`;
    await sql`DROP INDEX IF EXISTS idx_enrollments_class_status`;
    await sql`DROP INDEX IF EXISTS idx_grades_school_student`;
    await sql`DROP INDEX IF EXISTS idx_grades_student_period`;
    await sql`DROP INDEX IF EXISTS idx_report_cards_student_period_seq`;
    await sql`DROP INDEX IF EXISTS idx_attendance_school_student_status`;
    await sql`DROP INDEX IF EXISTS idx_academic_years_school_current`;
    await sql`DROP INDEX IF EXISTS idx_announcements_school_published`;
    await sql`DROP INDEX IF EXISTS idx_announcements_school_created`;
    await sql`DROP INDEX IF EXISTS idx_school_media_school_type`;
    await sql`DROP INDEX IF EXISTS idx_notifications_user_school_read`;

    console.log('  ✓ Rollback complete');
  },
};
