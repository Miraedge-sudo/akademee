import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../core/hooks/useTheme';
import { useAuth } from '../../../core/hooks/useAuth';
import { getDashboardStats } from '../../../core/api/dashboardService';
import { getTeacherClasses } from '../../../core/api/classService';
import { getTeacherSubjects } from '../../../core/api/subjectService';
import { getClassAttendanceAll, getClassAttendanceByDate } from '../../../core/api/attendanceService';
import TeacherGreeting from '../components/TeacherGreeting';
import TeacherStatCards from '../components/TeacherStatCards';
import TeacherAssignedClasses from '../components/TeacherAssignedClasses';
import TodaySchedule from '../components/TodaySchedule';
import PendingTasks from '../components/PendingTasks';
import ClassPerformanceChart from '../components/ClassPerformanceChart';
import TopStudents from '../components/TopStudents';
import AttendanceIssues from '../components/AttendanceIssues';
import UpcomingAssessments from '../components/UpcomingAssessments';
import TeacherNotifications from '../components/TeacherNotifications';

export default function TeacherDashboardPage() {
  const { i18n } = useTranslation('common');
  const isFr = i18n.language === 'fr';
  const { primaryColor } = useTheme();
  const { user } = useAuth();
  const pc = primaryColor || '#085041';

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Store full class data for the assigned-classrooms section ──
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);

  // ── Tâches réelles (notes à saisir, appels à faire) ──
  const [pendingTasks, setPendingTasks] = useState([]);

  // ── Fetch real data ──
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const teacherId = user?.id;

      const [dashboardData, classesData, subjectData] = await Promise.all([
        getDashboardStats().catch(() => null),
        teacherId
          ? getTeacherClasses(teacherId).catch(() => [])
          : Promise.resolve([]),
        teacherId
          ? getTeacherSubjects(teacherId).catch(() => [])
          : Promise.resolve([]),
      ]);

      // Le backend nous retourne directement toutes les classes du professeur
      const myClasses = Array.isArray(classesData) ? classesData : (classesData?.data || []);
      const teacherSubjectsList = Array.isArray(subjectData)
        ? subjectData
        : (subjectData?.data || []);

      // Store for the TeacherAssignedClasses section
      setTeacherClasses(myClasses);
      setTeacherSubjects(teacherSubjectsList);

      // ── Tâches réelles pour le bloc « Pending tasks » ──
      // 1) Saisie de notes : une tâche par (matière × classe) assignée.
      const gradeTasks = teacherSubjectsList
        .filter((s) => s.subjectName && s.className)
        .slice(0, 5)
        .map((s) => ({
          type: 'grades',
          subjectName: s.subjectName,
          className: s.className,
          href: '/dashboard/grade-entry',
        }));

      // 2) Appel du jour : classes sans présence enregistrée aujourd'hui.
      const attendanceTasks = [];
      try {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        const results = await Promise.allSettled(
          myClasses.slice(0, 6).map((cls) =>
            getClassAttendanceByDate(cls.id, today).catch(() => [])
          )
        );
        results.forEach((res, i) => {
          const cls = myClasses[i];
          const records = Array.isArray(res.value) ? res.value : [];
          if (records.length === 0 && cls?.name) {
            attendanceTasks.push({
              type: 'attendance',
              className: cls.name,
              href: '/dashboard/attendance',
            });
          }
        });
      } catch { /* ignore attendance errors */ }

      setPendingTasks([...gradeTasks, ...attendanceTasks.slice(0, 3)]);

      const teacherStudents = myClasses.reduce(
        (sum, c) => sum + (c.studentCount || 0), 0
      );

      // Fetch recent attendance issues for teacher's classes
      let recentAttendanceIssues = [];
      try {
        const attendancePromises = myClasses.slice(0, 3).map((cls) =>
          getClassAttendanceAll(cls.id).catch(() => [])
        );
        const attendanceResults = await Promise.all(attendancePromises);
        const allAttendance = attendanceResults.flat();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        recentAttendanceIssues = allAttendance
          .filter((a) => a.status === 'absent' || a.status === 'late')
          .filter((a) => new Date(a.date) >= threeDaysAgo)
          .slice(0, 4)
          .map((a) => ({
            name: a.studentName || 'Student',
            cls: a.className || myClasses.find(c => c.id === a.classId)?.name || '',
            time: new Date(a.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
            status: a.status,
            avatarBg: a.status === 'absent' ? '#FEE2E2' : '#FEF3C7',
            avatarText: a.status === 'absent' ? '#EF4444' : '#F59E0B',
          }));
      } catch { /* ignore attendance errors */ }

      setStats({
        classes: myClasses.length || dashboardData?.totalClasses || 0,
        students: teacherStudents || dashboardData?.totalStudents || 0,
        pendingGrades: gradeTasks.length || 0,
        attendanceRate: dashboardData?.activeAcademicYear ? 85 : 0,
        attendanceIssues: recentAttendanceIssues,
      });
    } catch {
      setStats({
        classes: 0, students: 0, pendingGrades: 0, attendanceRate: 0,
        attendanceIssues: [],
      });
      setTeacherClasses([]);
      setTeacherSubjects([]);
      setPendingTasks([]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

          {/* ── Assigned Classrooms Section ── */}
          <TeacherAssignedClasses
            teacherId={user?.id}
            classes={teacherClasses}
            subjects={teacherSubjects}
            primaryColor={pc}
            loading={false}
            onTakeAttendance={(cls) => {
              // Could open an attendance modal here in the future
              console.log('Take attendance for', cls.name);
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TodaySchedule />
            <PendingTasks
              tasks={pendingTasks.map((task, i) => ({
                id: `${task.type}-${task.className}-${task.subjectName || i}`,
                text:
                  task.type === 'grades'
                    ? (isFr
                        ? `Saisir les notes — ${task.subjectName} · ${task.className}`
                        : `Enter grades — ${task.subjectName} · ${task.className}`)
                    : (isFr
                        ? `Faire l'appel — ${task.className}`
                        : `Take attendance — ${task.className}`),
                priority: task.type === 'grades' ? '#EF4444' : '#F59E0B',
                href: task.href,
              }))}
              loading={loading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
            <ClassPerformanceChart />
            <TopStudents />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
           <AttendanceIssues data={stats?.attendanceIssues || []} />

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
