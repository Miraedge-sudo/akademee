const sql = require("../config/database");

class DashboardService {
  async getStats(schoolId, { academicYearId } = {}) {
    // ── Phase 1: resolve active year + run all independent aggregates in
    // parallel (1 round trip instead of 9 sequential ones). ──
    const [
      activeYearRows,
      studentCount,
      teacherCount,
      secretaryCount,
      parentCount,
      accountantCount,
      classCount,
      userCount,
      activeYearCheck,
    ] = await Promise.all([
      academicYearId
        ? Promise.resolve([])
        : sql`
            SELECT academic_year_id FROM academic_years
            WHERE school_id = ${schoolId} AND is_current = true
            LIMIT 1
          `,
      sql`
        SELECT COUNT(*)::int AS total FROM students WHERE school_id = ${schoolId} AND status = 'active'
      `,
      // Teacher count: from user_roles (not class_teachers) because teachers may
      // be assigned via subject_teachers rather than class_teachers. The frontend
      // explicitly requests stats without academic year filtering.
      sql`
        SELECT COUNT(*)::int AS total
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.user_id
        JOIN roles r ON ur.role_id = r.role_id
        WHERE u.school_id = ${schoolId}
          AND UPPER(r.role_code) = 'TEACHER'
          AND u.is_active = true
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.user_id
        JOIN roles r ON ur.role_id = r.role_id
        WHERE u.school_id = ${schoolId}
          AND UPPER(r.role_code) = 'SECRETARY'
          AND u.is_active = true
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.user_id
        JOIN roles r ON ur.role_id = r.role_id
        WHERE u.school_id = ${schoolId}
          AND UPPER(r.role_code) = 'PARENT'
          AND u.is_active = true
      `,
      sql`
        SELECT COUNT(*)::int AS total
        FROM user_roles ur
        JOIN users u ON ur.user_id = u.user_id
        JOIN roles r ON ur.role_id = r.role_id
        WHERE u.school_id = ${schoolId}
          AND UPPER(r.role_code) = 'ACCOUNTANT'
          AND u.is_active = true
      `,
      // Class count: ALL classes regardless of academic year.
      sql`
        SELECT COUNT(*)::int AS total FROM classes WHERE school_id = ${schoolId}
      `,
      sql`
        SELECT COUNT(*)::int AS total FROM users WHERE school_id = ${schoolId} AND is_active = true
      `,
      sql`
        SELECT COUNT(*)::int AS total FROM academic_years WHERE school_id = ${schoolId} AND is_current = true
      `,
    ]);

    // Resolve the academic year used by the revenue query.
    academicYearId = academicYearId || activeYearRows[0]?.academic_year_id || null;

    // ── Phase 2: revenue depends on the resolved academic year. ──
    const [revenueData] = await sql`
      SELECT COALESCE(SUM(amount), 0)::numeric AS total
      FROM payments
      WHERE school_id = ${schoolId} AND status = 'completed'
        ${academicYearId ? sql`AND academic_year_id = ${academicYearId}` : sql``}
    `;

    // The `postgres` driver always returns rows as an ARRAY, so each COUNT
    // result is `[ { total: N } ]` — read `[0]?.total` (undefined rows safe).
    return {
      totalStudents: studentCount[0]?.total ?? 0,
      totalTeachers: teacherCount[0]?.total ?? 0,
      totalSecretaries: secretaryCount[0]?.total ?? 0,
      totalParents: parentCount[0]?.total ?? 0,
      totalAccountants: accountantCount[0]?.total ?? 0,
      totalUsers: userCount[0]?.total ?? 0,
      totalClasses: classCount[0]?.total ?? 0,
      totalRevenue: Number(revenueData?.total ?? 0),
      activeAcademicYear: (activeYearCheck[0]?.total ?? 0) > 0,
      academicYearId: academicYearId,
    };
  }

  async getRecentActivities(schoolId, { limit = 10, academicYearId } = {}) {
    limit = Math.min(Math.max(1, limit), 50);

    // Resolve the academic year filter first (used by all three queries).
    if (!academicYearId) {
      const [activeYear] = await sql`
        SELECT academic_year_id FROM academic_years
        WHERE school_id = ${schoolId} AND is_current = true
        LIMIT 1
      `;
      academicYearId = activeYear?.academic_year_id || null;
    }

    // ── The three source queries are independent — run them in parallel
    // (1 round trip instead of 3 sequential ones). ──
    const [students, payments, grades] = await Promise.all([
      sql`
        SELECT CONCAT(u.first_name, ' ', u.last_name) AS name, 'student_created' AS action, st.created_at AS date
        FROM students st
        JOIN users u ON st.user_id = u.user_id
        LEFT JOIN enrollments e ON st.student_id = e.student_id AND e.status = 'active'
        LEFT JOIN classes c ON e.class_id = c.class_id
        WHERE st.school_id = ${schoolId}
          ${academicYearId ? sql`AND c.academic_year_id = ${academicYearId}` : sql``}
        ORDER BY st.created_at DESC
        LIMIT ${limit}
      `,
      sql`
        SELECT CONCAT(u.first_name, ' ', u.last_name) AS name, 'payment_received' AS action, p.created_at AS date
        FROM payments p
        LEFT JOIN students st ON p.student_id = st.student_id
        LEFT JOIN users u ON st.user_id = u.user_id
        WHERE p.school_id = ${schoolId}
          ${academicYearId ? sql`AND p.academic_year_id = ${academicYearId}` : sql``}
        ORDER BY p.created_at DESC
        LIMIT ${limit}
      `,
      sql`
        SELECT CONCAT(u.first_name, ' ', u.last_name) AS name, 'grade_recorded' AS action, g.created_at AS date
        FROM grades g
        LEFT JOIN students st ON g.student_id = st.student_id
        LEFT JOIN users u ON st.user_id = u.user_id
        ${academicYearId ? sql`JOIN periods p ON g.period_id = p.period_id AND p.academic_year_id = ${academicYearId}` : sql``}
        WHERE g.school_id = ${schoolId}
        ORDER BY g.created_at DESC
        LIMIT ${limit}
      `,
    ]);

    const all = [...students, ...payments, ...grades]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    return all.map((a) => ({
      description:
        a.action === "student_created"
          ? `New student "${a.name}" enrolled`
          : a.action === "payment_received"
            ? `Payment received from ${a.name || "a student"}`
            : `Grade recorded for ${a.name || "a student"}`,
      date: a.date,
      type: a.action,
    }));
  }

  async getFinanceStats(schoolId) {
    // If no academicYearId provided, use the active academic year
    const [activeYear] = await sql`
      SELECT academic_year_id FROM academic_years
      WHERE school_id = ${schoolId} AND is_current = true
      LIMIT 1
    `;
    const academicYearId = activeYear?.academic_year_id || null;

    // 1. Monthly collections (last 7 months aggregated by month)
    const monthlyData = await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', p.created_at), 'Mon') AS month_label,
        EXTRACT(MONTH FROM p.created_at)::int AS month_num,
        EXTRACT(YEAR FROM p.created_at)::int AS year,
        COALESCE(SUM(p.amount), 0)::numeric AS total
      FROM payments p
      WHERE p.school_id = ${schoolId}
        AND p.status = 'completed'
        AND p.created_at >= NOW() - INTERVAL '7 months'
        ${academicYearId ? sql`AND p.academic_year_id = ${academicYearId}` : sql``}
      GROUP BY DATE_TRUNC('month', p.created_at), EXTRACT(MONTH FROM p.created_at), EXTRACT(YEAR FROM p.created_at)
      ORDER BY year ASC, month_num ASC
    `;

    const monthlyTotal = Number(monthlyData.reduce((s, r) => s + Number(r.total), 0));

    // 2. Monthly collections by class (for the class filter in the chart)
    const monthlyByClass = await sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', p.created_at), 'Mon') AS month_label,
        EXTRACT(MONTH FROM p.created_at)::int AS month_num,
        EXTRACT(YEAR FROM p.created_at)::int AS year,
        COALESCE(c.name, 'Unassigned') AS class_name,
        COALESCE(SUM(p.amount), 0)::numeric AS total
      FROM payments p
      LEFT JOIN enrollments e ON p.student_id = e.student_id AND e.status = 'active'
      LEFT JOIN classes c ON e.class_id = c.class_id
      WHERE p.school_id = ${schoolId}
        AND p.status = 'completed'
        AND p.created_at >= NOW() - INTERVAL '7 months'
        ${academicYearId ? sql`AND p.academic_year_id = ${academicYearId}` : sql``}
      GROUP BY DATE_TRUNC('month', p.created_at), EXTRACT(MONTH FROM p.created_at), EXTRACT(YEAR FROM p.created_at), c.name
      ORDER BY year ASC, month_num ASC, class_name ASC
    `;

    // 3. Collection by class (aggregated totals per class)
    const collectionByClass = await sql`
      SELECT
        c.class_id,
        c.name AS class_name,
        COALESCE(SUM(sf.amount_due), 0)::numeric AS total_fees,
        COALESCE(SUM(p.amount), 0)::numeric AS total_paid
      FROM classes c
      LEFT JOIN enrollments e ON c.class_id = e.class_id AND e.status = 'active'
      LEFT JOIN student_fees sf ON e.student_id = sf.student_id
      LEFT JOIN payments p ON e.student_id = p.student_id AND p.status = 'completed'
        ${academicYearId ? sql`AND p.academic_year_id = ${academicYearId}` : sql``}
      WHERE c.school_id = ${schoolId}
      GROUP BY c.class_id, c.name
      HAVING COALESCE(SUM(sf.amount_due), 0) > 0
      ORDER BY c.name ASC
    `;

    // 4. Outstanding alerts — students with highest unpaid balances
    const outstandingAlerts = await sql`
      SELECT DISTINCT ON (st.student_id)
        st.student_id,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name,
        COALESCE(c.name, 'N/A') AS class_name,
        COALESCE(SUM(sf.amount_due) OVER (PARTITION BY st.student_id), 0)::numeric AS total_due,
        COALESCE(SUM(p.amount) OVER (PARTITION BY st.student_id), 0)::numeric AS total_paid,
        (COALESCE(SUM(sf.amount_due) OVER (PARTITION BY st.student_id), 0) - COALESCE(SUM(p.amount) OVER (PARTITION BY st.student_id), 0))::numeric AS balance,
        GREATEST(MAX(p.created_at) OVER (PARTITION BY st.student_id), st.created_at) AS last_activity
      FROM students st
      LEFT JOIN users u ON st.user_id = u.user_id
      LEFT JOIN enrollments e ON st.student_id = e.student_id AND e.status = 'active'
      LEFT JOIN classes c ON e.class_id = c.class_id
      LEFT JOIN student_fees sf ON st.student_id = sf.student_id
      LEFT JOIN payments p ON st.student_id = p.student_id AND p.status = 'completed'
      WHERE st.school_id = ${schoolId}
        AND st.status = 'active'
      ORDER BY st.student_id
    `;

    // Process outstanding alerts: filter to those with balance > 0 and rank by severity
    const defaults = outstandingAlerts
      .filter(r => Number(r.balance) > 0)
      .sort((a, b) => Number(b.balance) - Number(a.balance))
      .slice(0, 10)
      .map(r => {
        const balance = Number(r.balance);
        let level;
        if (balance >= 80000) level = 'critical';
        else if (balance >= 50000) level = 'high';
        else if (balance >= 30000) level = 'medium';
        else level = 'low';

        return {
          name: r.student_name,
          className: r.class_name,
          amount: balance,
          since: r.last_activity ? new Date(r.last_activity).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—',
          level,
        };
      });

    // 5. Fee status overview (counts by student fee_status)
    const [feeStatusCounts] = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN fee_status = 'paid' THEN 1 ELSE 0 END), 0)::int AS paid,
        COALESCE(SUM(CASE WHEN fee_status = 'partial' THEN 1 ELSE 0 END), 0)::int AS partial,
        COALESCE(SUM(CASE WHEN fee_status IN ('pending', 'unpaid') THEN 1 ELSE 0 END), 0)::int AS unpaid
      FROM students
      WHERE school_id = ${schoolId} AND status = 'active'
    `;

    const totalCollected = monthlyTotal;
    const totalOutstanding = defaults.reduce((s, d) => s + d.amount, 0);
    const collectionRate = totalCollected > 0
      ? Math.round((totalCollected / (totalCollected + totalOutstanding)) * 100)
      : 0;

    return {
      monthlyCollections: {
        overall: monthlyData.map(r => ({ month: r.month_label, total: Number(r.total) })),
        byClass: monthlyByClass.map(r => ({ month: r.month_label, className: r.class_name, total: Number(r.total) })),
      },
      collectionByClass: collectionByClass.map(r => ({
        name: r.class_name,
        paid: Number(r.total_paid),
        total: Number(r.total_fees),
      })),
      outstandingAlerts: defaults,
      feeStatusOverview: {
        paid: Number(feeStatusCounts.paid),
        partial: Number(feeStatusCounts.partial),
        unpaid: Number(feeStatusCounts.unpaid),
      },
      totalCollected,
      outstanding: totalOutstanding,
      collectionRate,
    };
  }

  async getRevenueData(schoolId, { months = 6, academicYearId } = {}) {
    // Single combined query: resolve the active year inline so the revenue
    // aggregation happens in ONE round trip instead of two sequential ones.
    // Semantics preserved exactly:
    //  - explicit academicYearId → filter by it
    //  - no year but an active year exists → filter by the active year
    //  - no year and no active year → fall back to the last N months
    const rows = await sql`
      SELECT
        DATE_TRUNC('month', p.created_at) AS month,
        COALESCE(SUM(p.amount), 0)::numeric AS total
      FROM payments p
      -- At most ONE current year per school (DISTINCT ON mirrors the original
      -- LIMIT 1 lookup and prevents the join from multiplying payment rows).
      LEFT JOIN (
        SELECT DISTINCT ON (school_id) school_id, academic_year_id
        FROM academic_years
        WHERE is_current = true AND school_id = ${schoolId}
        ORDER BY school_id, academic_year_id
      ) ay ON ay.school_id = p.school_id
      WHERE p.school_id = ${schoolId}
        AND p.status = 'completed'
        AND (
          ${academicYearId
            ? sql`p.academic_year_id = ${academicYearId}`
            : sql`(ay.academic_year_id IS NOT NULL AND p.academic_year_id = ay.academic_year_id)
                   OR (ay.academic_year_id IS NULL AND p.created_at >= NOW() - INTERVAL '1 month' * ${months})`}
        )
      GROUP BY DATE_TRUNC('month', p.created_at)
      ORDER BY month ASC
    `;

    return rows.map((r) => ({
      month: r.month,
      total: Number(r.total),
    }));
  }
}

module.exports = new DashboardService();
