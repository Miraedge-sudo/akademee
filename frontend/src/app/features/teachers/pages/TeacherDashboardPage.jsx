import { useTheme } from '../../../core/hooks/useTheme';
import { useAuth } from '../../../core/hooks/useAuth';
import TeacherGreeting from '../components/TeacherGreeting';
import TeacherStatCards from '../components/TeacherStatCards';
import TodaySchedule from '../components/TodaySchedule';
import PendingTasks from '../components/PendingTasks';
import ClassPerformanceChart from '../components/ClassPerformanceChart';
import TopStudents from '../components/TopStudents';
import AttendanceIssues from '../components/AttendanceIssues';
import UpcomingAssessments from '../components/UpcomingAssessments';
import TeacherNotifications from '../components/TeacherNotifications';

const MOCK_STATS = {
  classes: 6,
  students: 187,
  pendingGrades: 12,
  attendanceRate: 94,
};

export default function TeacherDashboardPage() {
  const { primaryColor } = useTheme();
  const { user } = useAuth();
  const pc = primaryColor || '#085041';

  return (
    <div className="space-y-5">

      <TeacherGreeting
        teacher={user}
        classesToday={MOCK_STATS.classes}
        pendingGrades={MOCK_STATS.pendingGrades}
        pc={pc}
      />


      <TeacherStatCards stats={MOCK_STATS} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TodaySchedule />
        <PendingTasks />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <ClassPerformanceChart />
        <TopStudents />
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <AttendanceIssues />

        <div className="flex flex-col gap-4">
          <UpcomingAssessments />
          <TeacherNotifications />
        </div>
      </div>
    </div>
  );
}
