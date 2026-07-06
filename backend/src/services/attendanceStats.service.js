const sql = require('../config/database');

class AttendanceStatsService {
  async getStudentStats(schoolId, studentId) {
    const stats = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'present')::int AS present,
        COUNT(*) FILTER (WHERE status = 'absent')::int AS absent,
        COUNT(*) FILTER (WHERE status = 'late')::int AS late,
        COUNT(*) FILTER (WHERE status = 'excused')::int AS excused
      FROM attendance
      WHERE school_id = ${schoolId} AND student_id = ${studentId}
    `;

    const s = stats[0];
    const rate = s.total > 0 ? ((s.present + s.late) / s.total * 100) : 0;

    return {
      total: s.total,
      present: s.present,
      absent: s.absent,
      late: s.late,
      excused: s.excused,
      attendanceRate: Number(rate.toFixed(1)),
    };
  }

  async getClassStats(schoolId, classId, { startDate, endDate } = {}) {
    const stats = await sql`
      SELECT
        a.status,
        COUNT(*)::int AS count
      FROM attendance a
      JOIN enrollments e ON a.student_id = e.student_id AND e.class_id = ${classId}
      WHERE a.school_id = ${schoolId}
        ${startDate ? sql`AND a.date >= ${startDate}` : sql``}
        ${endDate ? sql`AND a.date <= ${endDate}` : sql``}
      GROUP BY a.status
    `;

    const students = await sql`
      SELECT COUNT(DISTINCT a.student_id)::int AS total
      FROM attendance a
      JOIN enrollments e ON a.student_id = e.student_id AND e.class_id = ${classId}
      WHERE a.school_id = ${schoolId}
    `;

    const map = { present: 0, absent: 0, late: 0, excused: 0 };
    let total = 0;
    for (const s of stats) {
      map[s.status] = s.count;
      total += s.count;
    }

    return {
      ...map,
      total,
      uniqueStudents: students[0].total,
      attendanceRate: total > 0 ? Number((((map.present + map.late) / total) * 100).toFixed(1)) : 0,
    };
  }

  async getMonthlyTrend(schoolId, { months = 6 } = {}) {
    const rows = await sql`
      SELECT
        DATE_TRUNC('month', date) AS month,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'present')::int AS present,
        COUNT(*) FILTER (WHERE status = 'absent')::int AS absent,
        COUNT(*) FILTER (WHERE status = 'late')::int AS late,
        COUNT(*) FILTER (WHERE status = 'excused')::int AS excused
      FROM attendance
      WHERE school_id = ${schoolId}
        AND date >= NOW() - INTERVAL '1 month' * ${months}
      GROUP BY DATE_TRUNC('month', date)
      ORDER BY month ASC
    `;

    return rows.map(r => {
      const total = Number(r.total);
      return {
        month: r.month,
        total,
        present: Number(r.present),
        absent: Number(r.absent),
        late: Number(r.late),
        excused: Number(r.excused),
        rate: total > 0 ? Number(((Number(r.present) + Number(r.late)) / total * 100).toFixed(1)) : 0,
      };
    });
  }
}

module.exports = new AttendanceStatsService();
