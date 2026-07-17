/**
 * StudentDashboardPage — Student portal home page.
 *
 * Architecture:
 *  - Route: /dashboard/student-home
 *  - Wrapped by AdminLayout via <Outlet />
 *  - Mock data is passed down; replace with API calls when endpoints are ready
 */
import { useAuth } from '../../../core/hooks/useAuth';
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
  
  // Extracting first name for the welcome banner
  const firstName = user?.firstName || 'Emma';

  return (
    <div className="space-y-1">
      {/* ── 1. Hero Banner ───────────────────────────────── */}
      <StudentHeroBanner name={firstName} />

      {/* ── 2. Stat Strip ────────────────────────────────── */}
      <StudentStatStrip />

      {/* ── 3. Row: Subject Grades + Sequence Chart ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-5 mb-5">
        <SubjectGrades />
        <SequencePerformance />
      </div>

      {/* ── 4. Row: Schedule/Notifs + Attendance/Fees ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <StudentSchedule />
          <StudentNotifications />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <AttendanceMiniCalendar />
          <FeeStatusWidget />
        </div>
      </div>
    </div>
  );
}
