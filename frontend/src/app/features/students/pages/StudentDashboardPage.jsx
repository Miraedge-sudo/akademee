/**
 * StudentDashboardPage — Student portal home page.
 *
 * Architecture:
 *  - Route: /dashboard/student-home
 *  - Fetches real data from multiple APIs in parallel
 *  - Passes data to child components (no more mock data)
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../../core/hooks/useAuth';
import { getStudentMe } from '../../../core/api/studentService';
import { getStudentAverages, getClassRankings } from '../../../core/api/gradeCalculationService';
import { getAttendanceStats } from '../../../core/api/attendanceService';
import { getStudentFeeSummary } from '../../../core/api/feeCalculationService';
import { getStudentEnrollments } from '../../../core/api/enrollmentService';
import StudentHeroBanner from '../components/StudentHeroBanner';
import StudentStatStrip from '../components/StudentStatStrip';
import SubjectGrades from '../components/SubjectGrades';
import SequencePerformance from '../components/SequencePerformance';
import StudentSchedule from '../components/StudentSchedule';
import StudentNotifications from '../components/StudentNotifications';
import AttendanceMiniCalendar from '../components/AttendanceMiniCalendar';
import FeeStatusWidget from '../components/FeeStatusWidget';

export default function StudentDashboardPage() {
  const { user } = useAuth();

  // ── Data state ──
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [averages, setAverages] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [rankData, setRankData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError(null);
      try {
        // 1. Get the student profile (provides studentId, classId, className, etc.)
        const profile = await getStudentMe();
        setStudent(profile);
        const studentId = profile.id;
        const classId = profile.classId;

        // 2. Fetch all data in parallel
        const promises = [
          getStudentAverages(studentId).catch(() => null),
          getAttendanceStats({ studentId }).catch(() => null),
          getStudentFeeSummary(studentId).catch(() => null),
          getStudentEnrollments(studentId).catch(() => null),
        ];

        if (classId) {
          promises.push(getClassRankings(classId).catch(() => []));
        }

        const [avgRes, attRes, feeRes, enrollRes, rankRes] = await Promise.all(promises);

        setAverages(avgRes);
        setAttendanceStats(attRes);
        setFeeSummary(feeRes);
        setEnrollment(enrollRes);
        setRankData(rankRes || []);
      } catch (err) {
        console.error("Failed to load student data:", err);
        setError("Unable to load your data. Please try again.");
        // Create fallback from user data
        setStudent({
          id: null,
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          fullName: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Student',
          className: user?.className || '',
          studentNumber: '',
          classId: null,
          feeStatus: 'pending',
        });
      }
      setLoading(false);
    }
    loadAll();
  }, [user]);

  // ── Derive values ──
  const firstName = student?.firstName || user?.firstName || 'Student';
  const className = student?.className || enrollment?.className || '';
  const studentId = student?.id;
  const classId = student?.classId || enrollment?.classId;
  const studentNumber = student?.studentNumber || '';

  // Annual average
  const annualAvg = averages?.overallAverage || 0;

  // Attendance stats
  const attendanceRate = attendanceStats?.attendanceRate || 0;
  const totalAbsences = (attendanceStats?.absent || 0) + (attendanceStats?.late || 0);

  // Fee summary
  const totalDue = feeSummary?.totalDue || 0;
  const totalPaid = feeSummary?.totalPaid || 0;
  const feeStatus = feeSummary?.status || student?.feeStatus || 'pending';
  const paidPct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  // Rank
  const myRank = rankData?.length > 0
    ? rankData.find(r => r.studentId === studentId)
    : null;
  const rank = myRank?.rank || '-';
  const totalStudents = rankData?.length || 0;
  const rankStr = rank !== '-' ? `${rank}${rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'}` : '-';

  if (loading) {
    return (
      <div className="space-y-1">
        <div className="rounded-2xl h-48 bg-surface-100 dark:bg-surface-800 animate-pulse mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-surface-100 dark:bg-surface-800 rounded-2xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          <div className="h-72 bg-surface-100 dark:bg-surface-800 rounded-2xl animate-pulse" />
          <div className="h-72 bg-surface-100 dark:bg-surface-800 rounded-2xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <div className="flex flex-col gap-4">
            <div className="h-52 bg-surface-100 dark:bg-surface-800 rounded-2xl animate-pulse" />
            <div className="h-40 bg-surface-100 dark:bg-surface-800 rounded-2xl animate-pulse" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="h-64 bg-surface-100 dark:bg-surface-800 rounded-2xl animate-pulse" />
            <div className="h-40 bg-surface-100 dark:bg-surface-800 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* ── 1. Hero Banner ───────────────────────────────── */}
      <StudentHeroBanner
        name={firstName}
        className={className}
        matricule={studentNumber}
        status={student?.status || 'Active'}
        rank={rank}
        totalStudents={totalStudents}
        annualAvg={annualAvg}
      />

      {/* ── 2. Stat Strip ────────────────────────────────── */}
      <StudentStatStrip
        annualAvg={annualAvg}
        attendanceRate={attendanceRate}
        feesPaidPct={paidPct}
        rankStr={rankStr}
        totalAbsences={totalAbsences}
        totalDue={totalDue}
        totalPaid={totalPaid}
      />

      {/* ── 3. Row: Subject Grades + Sequence Chart ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5 mb-5">
        <SubjectGrades averages={averages} studentId={studentId} />
        <SequencePerformance studentId={studentId} />
      </div>

      {/* ── 4. Row: Schedule + Notifications | Attendance + Fees ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <StudentSchedule studentId={studentId} classId={classId} />
          <StudentNotifications />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <AttendanceMiniCalendar studentId={studentId} attendanceStats={attendanceStats} />
          <FeeStatusWidget
            paid={totalPaid}
            total={totalDue}
            status={feeStatus}
          />
        </div>
      </div>
    </div>
  );
}
