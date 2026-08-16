/**
 * MyAttendancePage — Student attendance overview page.
 *
 * Features:
 *  - Hero banner with student info
 *  - Attendance stats (rate, present, absent, late, excused)
 *  - Navigable month calendar (all months, not just the current one)
 *  - Full attendance history list (every recorded day, grouped by month)
 *
 * Route: /dashboard/my-attendance
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import { useTheme } from '../../../core/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { getStudentMe } from '../../../core/api/studentService';
import { getAttendanceStats, getStudentAttendance } from '../../../core/api/attendanceService';
import AttendanceMiniCalendar from '../components/AttendanceMiniCalendar';
import {
  FiArrowLeft as ArrowLeft,
  FiCalendar as CalendarCheck,
  FiCheckCircle as CheckCircle2,
  FiXCircle as XCircle,
  FiClock as Clock,
  FiTrendingUp as TrendingUp,
} from "react-icons/fi";

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

const STATUS_STYLE = {
  present: { bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  absent:  { bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
  late:    { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  excused: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
};

export default function MyAttendancePage() {
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const pc = primaryColor || '#085041';
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const profile = await getStudentMe();
        setStudent(profile);
        const studentId = profile.id;
        const [attRes, recRes] = await Promise.all([
          getAttendanceStats({ studentId }).catch(() => null),
          getStudentAttendance(studentId).catch(() => []),
        ]);
        setStats(attRes);
        setRecords(Array.isArray(recRes) ? recRes : []);
      } catch (err) {
        console.error('Failed to load attendance:', err);
        setError(t('student.attendance.loadError'));
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const studentId = student?.id;
  const totalRecords = stats ? (stats.present + stats.absent + stats.late + stats.excused) : 0;
  const rate = stats?.attendanceRate || 0;
  const rateColor = rate >= 75 ? '#1D9E75' : rate >= 50 ? '#F59E0B' : '#EF4444';

  // Group records by month for the history list (most recent first)
  const historyByMonth = useMemo(() => {
    const groups = [];
    const byKey = {};
    for (const rec of records) {
      if (!rec.date) continue;
      const d = new Date(rec.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!byKey[key]) {
        byKey[key] = { key, label: d.toLocaleDateString(locale, { month: 'long', year: 'numeric' }), items: [] };
        groups.push(byKey[key]);
      }
      byKey[key].items.push({ date: d, status: rec.status });
    }
    groups.sort((a, b) => (a.key < b.key ? 1 : -1));
    for (const g of groups) {
      g.items.sort((a, b) => (a.date < b.date ? 1 : -1));
    }
    return groups;
  }, [records, locale]);

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
            {t('student.attendance.backToDashboard')}
          </button>
          <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight mb-2">
            {t('student.attendance.title')}
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
          label={t('student.attendance.attendanceRate')}
          value={`${rate}%`}
          color={rateColor}
          sub={totalRecords > 0 ? `${totalRecords} ${t('student.attendance.records')}` : ''}
        />
        <StatCard
          icon={CheckCircle2}
          label={t('student.attendance.present')}
          value={stats?.present || 0}
          color="#1D9E75"
        />
        <StatCard
          icon={XCircle}
          label={t('student.attendance.absent')}
          value={stats?.absent || 0}
          color="#EF4444"
        />
        <StatCard
          icon={Clock}
          label={t('student.attendance.late')}
          value={stats?.late || 0}
          color="#F59E0B"
        />
      </div>

      {/* ── Rate Ring + Breakdown + Calendar ── */}
      <div className="ma-fade grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ animationDelay: '0.08s' }}>
        {/* Rate gauge */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm">
          <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
            {t('student.attendance.attendanceRate')}
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
                  {t('student.attendance.rate')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm">
          <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
            {t('student.attendance.breakdown')}
          </h3>
          <div className="space-y-4">
            {[
              { label: t('student.attendance.present'), value: stats?.present || 0, color: '#1D9E75' },
              { label: t('student.attendance.absent'), value: stats?.absent || 0, color: '#EF4444' },
              { label: t('student.attendance.late'), value: stats?.late || 0, color: '#F59E0B' },
              { label: t('student.attendance.excused'), value: stats?.excused || 0, color: '#3B82F6' },
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

      {/* ── Full history ── */}
      {totalRecords > 0 && (
        <div className="ma-fade bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
            <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100">
              {t('student.attendance.history')}
            </h3>
          </div>
          <p className="text-[12px] text-surface-400 mb-4">{t('student.attendance.historyDesc')}</p>

          <div className="space-y-5">
            {historyByMonth.map((group) => (
              <div key={group.key}>
                <div className="text-[12px] font-bold text-surface-500 uppercase tracking-wider mb-2 capitalize">
                  {group.label}
                </div>
                <div className="overflow-hidden rounded-xl border border-surface-100 dark:border-surface-700">
                  <div className="hidden sm:grid grid-cols-3 bg-surface-50 dark:bg-surface-900 px-4 py-2 text-[11px] font-bold text-surface-400 uppercase tracking-wider">
                    <div>{t('student.attendance.date')}</div>
                    <div>{t('student.attendance.day')}</div>
                    <div>{t('student.attendance.status')}</div>
                  </div>
                  <div className="divide-y divide-surface-100 dark:divide-surface-700">
                    {group.items.map((item, idx) => {
                      const st = STATUS_STYLE[item.status] || STATUS_STYLE.excused;
                      return (
                        <div key={idx} className="grid grid-cols-3 items-center px-4 py-2.5 hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors">
                          <div className="text-[13px] font-semibold text-surface-700 dark:text-surface-200">
                            {item.date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-[13px] text-surface-500 capitalize">
                            {item.date.toLocaleDateString(locale, { weekday: 'long' })}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: st.dot }} />
                            <span
                              className="text-[11px] font-bold px-2 py-0.5 rounded-full capitalize"
                              style={{ background: st.bg, color: st.text }}
                            >
                              {t(`student.attendance.${item.status}`)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {totalRecords === 0 && !loading && (
        <div className="ma-fade flex flex-col items-center justify-center py-8 text-center" style={{ animationDelay: '0.1s' }}>
          <CalendarCheck size={32} className="text-surface-200 dark:text-surface-600 mb-3" />
          <p className="text-sm font-medium text-surface-400">{t('student.attendance.noRecords')}</p>
          <p className="text-[12px] text-surface-300 mt-1">{t('student.attendance.noRecordsDesc')}</p>
        </div>
      )}
    </div>
  );
}
