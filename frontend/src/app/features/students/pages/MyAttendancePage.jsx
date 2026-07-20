/**
 * MyAttendancePage — Student attendance overview page.
 *
 * Features:
 *  - Hero banner with student info
 *  - Attendance stats (rate, present, absent, late, excused)
 *  - Full month calendar view
 *  - Attendance trends
 *
 * Route: /dashboard/my-attendance
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import { useTheme } from '../../../core/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { getStudentMe } from '../../../core/api/studentService';
import { getAttendanceStats } from '../../../core/api/attendanceService';
import AttendanceMiniCalendar from '../components/AttendanceMiniCalendar';
import {
  ArrowLeft,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="bg-white dark:bg-surface-800 rounded-xl border-[1.5px] border-surface-100 dark:border-surface-700 p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div>
          <div className="text-[18px] font-extrabold text-surface-900 dark:text-surface-100">{value}</div>
          <div className="text-[11px] text-surface-400">{label}</div>
          {sub && <div className="text-[10px] text-surface-300">{sub}</div>}
        </div>
      </div>
    </div>
  );
}

export default function MyAttendancePage() {
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const pc = primaryColor || '#085041';
  const isFr = i18n.language === 'fr';

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const profile = await getStudentMe();
        setStudent(profile);
        const studentId = profile.id;
        const attRes = await getAttendanceStats({ studentId }).catch(() => null);
        setStats(attRes);
      } catch (err) {
        console.error('Failed to load attendance:', err);
        setError(isFr ? 'Échec du chargement' : 'Failed to load');
      }
      setLoading(false);
    }
    load();
  }, []);

  const studentId = student?.id;
  const totalRecords = stats ? (stats.present + stats.absent + stats.late + stats.excused) : 0;
  const rate = stats?.attendanceRate || 0;
  const rateColor = rate >= 75 ? '#1D9E75' : rate >= 50 ? '#F59E0B' : '#EF4444';

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-surface-100 dark:bg-surface-800 rounded-xl" />)}
        </div>
        <div className="h-80 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-5">
      <style>{`
        @keyframes maFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ma-fade { animation: maFadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* ── Header ── */}
      <div
        className="ma-fade relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10">
          <button
            onClick={() => navigate('/dashboard/student-home')}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-[12px] font-medium mb-3 transition-colors"
          >
            <ArrowLeft size={14} />
            {isFr ? 'Retour au tableau de bord' : 'Back to dashboard'}
          </button>
          <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight mb-2">
            {isFr ? 'Mes Présences' : 'My Attendance'}
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            {student?.fullName}{student?.className ? ` · ${student.className}` : ''}
          </p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="ma-fade grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ animationDelay: '0.06s' }}>
        <StatCard
          icon={TrendingUp}
          label={isFr ? 'Taux de présence' : 'Attendance Rate'}
          value={`${rate}%`}
          color={rateColor}
          sub={totalRecords > 0 ? `${totalRecords} ${isFr ? 'enregistrements' : 'records'}` : ''}
        />
        <StatCard
          icon={CheckCircle2}
          label={isFr ? 'Présences' : 'Present'}
          value={stats?.present || 0}
          color="#1D9E75"
        />
        <StatCard
          icon={XCircle}
          label={isFr ? 'Absences' : 'Absent'}
          value={stats?.absent || 0}
          color="#EF4444"
        />
        <StatCard
          icon={Clock}
          label={isFr ? 'Retards' : 'Late'}
          value={stats?.late || 0}
          color="#F59E0B"
        />
      </div>

      {/* ── Rate Ring + Breakdown ── */}
      <div className="ma-fade grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ animationDelay: '0.08s' }}>
        {/* Rate gauge */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm">
          <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
            {isFr ? 'Taux de présence' : 'Attendance Rate'}
          </h3>
          <div className="flex flex-col items-center">
            <div className="relative w-36 h-36">
              <svg className="w-36 h-36 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#EEF0EC" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={rateColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(rate / 100) * 264} 264`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold" style={{ color: rateColor }}>{rate}%</span>
                <span className="text-[10px] text-surface-400 font-medium uppercase tracking-wider mt-1">
                  {isFr ? 'Présence' : 'Rate'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm">
          <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
            {isFr ? 'Répartition' : 'Breakdown'}
          </h3>
          <div className="space-y-4">
            {[
              { label: isFr ? 'Présents' : 'Present', value: stats?.present || 0, color: '#1D9E75' },
              { label: isFr ? 'Absents' : 'Absent', value: stats?.absent || 0, color: '#EF4444' },
              { label: isFr ? 'Retards' : 'Late', value: stats?.late || 0, color: '#F59E0B' },
              { label: isFr ? 'Excusés' : 'Excused', value: stats?.excused || 0, color: '#3B82F6' },
            ].map((item) => {
              const maxVal = Math.max(stats?.present || 1, stats?.absent || 1, stats?.late || 1, stats?.excused || 1, 1);
              const pct = (item.value / maxVal) * 100;
              return (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-surface-500 w-16 text-right">{item.label}</span>
                  <div className="flex-1 h-4 bg-surface-50 dark:bg-surface-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}80)`,
                      }}
                    />
                  </div>
                  <span className="text-[12px] font-extrabold min-w-[24px]" style={{ color: item.color }}>{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm">
          <AttendanceMiniCalendar studentId={studentId} attendanceStats={stats} />
        </div>
      </div>

      {/* ── Empty state ── */}
      {totalRecords === 0 && !loading && (
        <div className="ma-fade flex flex-col items-center justify-center py-8 text-center" style={{ animationDelay: '0.1s' }}>
          <CalendarCheck size={32} className="text-surface-200 dark:text-surface-600 mb-3" />
          <p className="text-sm font-medium text-surface-400">
            {isFr ? 'Aucune donnée de présence disponible' : 'No attendance data available'}
          </p>
        </div>
      )}
    </div>
  );
}
