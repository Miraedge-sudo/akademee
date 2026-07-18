import { useState, useEffect } from 'react';
import { useTheme } from '../../../core/hooks/useTheme';
import { useAuth } from '../../../core/hooks/useAuth';
import { getDashboardStats } from '../../../core/api/dashboardService';
import { getClasses } from '../../../core/api/classService';
import { getAllClassTeacherAssignments } from '../../../core/api/subjectService';
import TeacherGreeting from '../components/TeacherGreeting';
import TeacherStatCards from '../components/TeacherStatCards';
import TodaySchedule from '../components/TodaySchedule';
import PendingTasks from '../components/PendingTasks';
import ClassPerformanceChart from '../components/ClassPerformanceChart';
import TopStudents from '../components/TopStudents';
import AttendanceIssues from '../components/AttendanceIssues';
import UpcomingAssessments from '../components/UpcomingAssessments';
import TeacherNotifications from '../components/TeacherNotifications';

export default function TeacherDashboardPage() {
  const { primaryColor } = useTheme();
  const { user } = useAuth();
  const pc = primaryColor || '#085041';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const teacherId = user?.id;

        // Fetch dashboard stats and teacher's assigned classes in parallel
        const [dashboardData, classData, assignmentData] = await Promise.all([
          getDashboardStats().catch(() => null),
          getClasses().catch(() => ({ classes: [] })),
          teacherId
            ? getAllClassTeacherAssignments().catch(() => [])
            : Promise.resolve([]),
        ]);

        if (!mounted) return;

        const allClasses = classData?.classes || classData || [];
        const allAssignments = Array.isArray(assignmentData)
          ? assignmentData
          : (assignmentData?.data || []);

        // Filter classes assigned to this teacher
        // Use String() coercion to avoid type mismatches (UUID string vs number)
        const teacherAssignmentClassIds = new Set(
          allAssignments
            .filter((a) => String(a.teacherId) === String(teacherId))
            .map((a) => a.classId)
        );
        const teacherClasses = allClasses.filter((c) =>
          teacherAssignmentClassIds.has(c.id)
        );

        // Calculate stats
        const totalStudents = allClasses.reduce(
          (sum, c) => sum + (c.studentsCount || 0),
          0
        );
        const teacherStudents = teacherClasses.reduce(
          (sum, c) => sum + (c.studentsCount || 0),
          0
        );

        setStats({
          classes: teacherClasses.length || dashboardData?.totalClasses || 0,
          students: teacherStudents || totalStudents || dashboardData?.totalStudents || 0,
          pendingGrades: 0, // Will be fetched from grades API when available
          attendanceRate: dashboardData?.activeAcademicYear ? 85 : 0,
        });
      } catch {
        if (mounted) {
          setStats({
            classes: 0,
            students: 0,
            pendingGrades: 0,
            attendanceRate: 0,
          });
        }
      }
      if (mounted) setLoading(false);
    }

    fetchData();
    return () => { mounted = false; };
  }, [user?.id]);

  return (
    <div className="space-y-5">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-surface-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <TeacherGreeting
            teacher={user}
            classesToday={stats?.classes || 0}
            pendingGrades={stats?.pendingGrades || 0}
            pc={pc}
          />

          <TeacherStatCards stats={stats} />

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
        </>
      )}
    </div>
  );
}
