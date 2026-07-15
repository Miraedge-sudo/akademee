const sql = require('../config/database');

class DashboardService {
  async getStats(schoolId, { academicYearId } = {}) {
    const [studentCount] = await sql`
      SELECT COUNT(*)::int AS total FROM students WHERE school_id = ${schoolId} AND status = 'active'
    `;

    const [teacherCount] = academicYearId
      ? await sql`
          SELECT COUNT(DISTINCT c.class_teacher_id)::int AS total
          FROM classes c
          WHERE c.school_id = ${schoolId} AND c.academic_year_id = ${academicYearId}
            AND c.class_teacher_id IS NOT NULL
        `
      : await sql`
          SELECT COUNT(*)::int AS total
          FROM user_roles ur
          JOIN users u ON ur.user_id = u.user_id
          JOIN roles r ON ur.role_id = r.role_id
          WHERE u.school_id = ${schoolId} AND r.role_code = 'teacher' AND u.is_active = true
        `;

    const [classCount] = await sql`
      SELECT COUNT(*)::int AS total FROM classes WHERE school_id = ${schoolId}
        ${academicYearId ? sql`AND academic_year_id = ${academicYearId}` : sql``}
    `;

    const [revenueData] = await sql`
      SELECT COALESCE(SUM(amount), 0)::numeric AS total
      FROM payments
      WHERE school_id = ${schoolId} AND status = 'completed'
    `;

    const [userCount] = await sql`
      SELECT COUNT(*)::int AS total FROM users WHERE school_id = ${schoolId} AND is_active = true
    `;

    const [activeYear] = await sql`
      SELECT COUNT(*)::int AS total FROM academic_years WHERE school_id = ${schoolId} AND is_current = true
    `;

    return {
      totalStudents: studentCount.total,
      totalTeachers: teacherCount.total,
      totalUsers: userCount.total,
      totalClasses: classCount.total,
      totalRevenue: Number(revenueData.total),
      activeAcademicYear: activeYear.total > 0,
    };
  }

  async getRecentActivities(schoolId, { limit = 10, academicYearId } = {}) {
    limit = Math.min(Math.max(1, limit), 50);

    const students = await sql`
      SELECT CONCAT(u.first_name, ' ', u.last_name) AS name, 'student_created' AS action, st.created_at AS date
      FROM students st
      JOIN users u ON st.user_id = u.user_id
      LEFT JOIN enrollments e ON st.student_id = e.student_id AND e.status = 'active'
      LEFT JOIN classes c ON e.class_id = c.class_id
      WHERE st.school_id = ${schoolId}
        ${academicYearId ? sql`AND c.academic_year_id = ${academicYearId}` : sql``}
      ORDER BY st.created_at DESC
      LIMIT ${limit}
    `;

    const payments = await sql`
      SELECT CONCAT(u.first_name, ' ', u.last_name) AS name, 'payment_received' AS action, p.created_at AS date
      FROM payments p
      LEFT JOIN students st ON p.student_id = st.student_id
      LEFT JOIN users u ON st.user_id = u.user_id
      WHERE p.school_id = ${schoolId}
        ${academicYearId ? sql`AND p.academic_year_id = ${academicYearId}` : sql``}
      ORDER BY p.created_at DESC
      LIMIT ${limit}
    `;

    const grades = await sql`
      SELECT CONCAT(u.first_name, ' ', u.last_name) AS name, 'grade_recorded' AS action, g.created_at AS date
      FROM grades g
      LEFT JOIN students st ON g.student_id = st.student_id
      LEFT JOIN users u ON st.user_id = u.user_id
      ${academicYearId ? sql`JOIN periods p ON g.period_id = p.period_id AND p.academic_year_id = ${academicYearId}` : sql``}
      WHERE g.school_id = ${schoolId}
      ORDER BY g.created_at DESC
      LIMIT ${limit}
    `;

    const all = [...students, ...payments, ...grades]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    return all.map((a) => ({
      description: a.action === 'student_created'
        ? `New student "${a.name}" enrolled`
        : a.action === 'payment_received'
          ? `Payment received from ${a.name || 'a student'}`
          : `Grade recorded for ${a.name || 'a student'}`,
      date: a.date,
      type: a.action,
    }));
  }

  async getRevenueData(schoolId, { months = 6, academicYearId } = {}) {
    const rows = await sql`
      SELECT
        DATE_TRUNC('month', created_at) AS month,
        COALESCE(SUM(amount), 0)::numeric AS total
      FROM payments
      WHERE school_id = ${schoolId} AND status = 'completed'
        ${academicYearId ? sql`AND academic_year_id = ${academicYearId}` : sql`AND created_at >= NOW() - INTERVAL '1 month' * ${months}`}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `;

    return rows.map(r => ({
      month: r.month,
      total: Number(r.total),
    }));
  }
}

module.exports = new DashboardService();
