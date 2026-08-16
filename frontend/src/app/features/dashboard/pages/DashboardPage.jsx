import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { queryClient, dashboardQueryKeys } from '../../../core/api/queryClient';
import {
  FiUsers,
  FiUser,
  FiUserPlus,
  FiUserCheck,
  FiBook,
  FiDollarSign,
  FiPlus,
  FiFileText,
  FiCreditCard,
  FiArrowRight,
  FiCalendar,
  FiStar,
  FiTrendingUp,
  FiClock,
  FiCheckCircle,
  FiCheckSquare,
  FiShield,
  FiBookOpen,
  FiLayers,
  FiRefreshCw,
  FiBell,
  FiEdit,
  FiList,
  FiMail,
  FiMap,
  FiGrid,
  FiSearch,
} from 'react-icons/fi';
import {
  getDashboardStats,
  getRecentActivities,
  getRevenueData,
} from '../../../core/api/dashboardService';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { useTheme } from '../../../core/hooks/useTheme';
import { useYearFilter } from '../../../core/hooks/useYearFilter';
import Spinner from '../../../components/ui/Spinner';
import Card from '../../../components/ui/Card';
import { formatCurrency } from '../../../components/utils/colors';

// ── Month name short mapping ──
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Activity icon/color mapping by entity (real data comes from the audit trail) ──
const ACTIVITY_ENTITY = {
  students: { icon: FiUser, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  users: { icon: FiUserPlus, bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  classes: { icon: FiBook, bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  payments: { icon: FiDollarSign, bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  grades: { icon: FiStar, bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  announcements: { icon: FiBell, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  enrollments: { icon: FiUserCheck, bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' },
  subjects: { icon: FiBookOpen, bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400' },
  academic_years: { icon: FiCalendar, bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  periods: { icon: FiClock, bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
  sequences: { icon: FiList, bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  fees: { icon: FiCreditCard, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  student_fees: { icon: FiCreditCard, bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  attendance: { icon: FiCheckSquare, bg: 'bg-lime-100 dark:bg-lime-900/30', text: 'text-lime-600 dark:text-lime-400' },
  exams: { icon: FiEdit, bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  exam_registrations: { icon: FiEdit, bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  class_subjects: { icon: FiLayers, bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  subject_teachers: { icon: FiUsers, bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400' },
  class_teachers: { icon: FiUsers, bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-600 dark:text-sky-400' },
  guardians: { icon: FiUsers, bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-600 dark:text-teal-400' },
  invites: { icon: FiMail, bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-600 dark:text-pink-400' },
  system_levels: { icon: FiLayers, bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
  system_series: { icon: FiList, bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400' },
  faculties: { icon: FiMap, bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  departments: { icon: FiGrid, bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400' },
  programs: { icon: FiBookOpen, bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  research_projects: { icon: FiSearch, bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
  publications: { icon: FiFileText, bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  roles: { icon: FiShield, bg: 'bg-slate-100 dark:bg-slate-700/40', text: 'text-slate-600 dark:text-slate-300' },
  user_roles: { icon: FiShield, bg: 'bg-slate-100 dark:bg-slate-700/40', text: 'text-slate-600 dark:text-slate-300' },
  role_permissions: { icon: FiShield, bg: 'bg-slate-100 dark:bg-slate-700/40', text: 'text-slate-600 dark:text-slate-300' },
};

// ── Fallback icon for unknown activity entities ──
const FALLBACK_ACTIVITY = {
  icon: FiCalendar,
  bg: 'bg-surface-100 dark:bg-surface-700',
  text: 'text-surface-600 dark:text-surface-400',
};

// ── Action → localized verb ──
const ACTIVITY_VERBS = {
  create: { fr: 'a créé', en: 'created' },
  update: { fr: 'a modifié', en: 'updated' },
  delete: { fr: 'a supprimé', en: 'deleted' },
  publish: { fr: 'a publié', en: 'published' },
  unpublish: { fr: 'a dépublié', en: 'unpublished' },
  enroll: { fr: 'a inscrit', en: 'enrolled' },
  transfer: { fr: 'a transféré', en: 'transferred' },
  remove_student: { fr: 'a retiré', en: 'removed' },
  assign: { fr: 'a assigné', en: 'assigned' },
  remove: { fr: 'a retiré', en: 'removed' },
  activate: { fr: 'a activé', en: 'activated' },
  confirm: { fr: 'a confirmé', en: 'confirmed' },
  register: { fr: 'a enregistré', en: 'registered' },
  record_result: { fr: 'a enregistré un résultat', en: 'recorded a result' },
  send_invite: { fr: 'a envoyé une invitation', en: 'sent an invite' },
  bulk_create: { fr: 'a enregistré en masse', en: 'bulk recorded' },
  bulk_assign: { fr: 'a assigné en masse', en: 'bulk assigned' },
  assign_role: { fr: 'a assigné le rôle', en: 'assigned the role' },
  remove_role: { fr: 'a retiré le rôle', en: 'removed the role' },
  assign_permission: { fr: 'a assigné une permission', en: 'assigned a permission' },
  remove_permission: { fr: 'a retiré une permission', en: 'removed a permission' },
};
const DEFAULT_VERB = { fr: 'a effectué une action sur', en: 'performed an action on' };

// ── Entity → localized label ──
const ACTIVITY_ENTITY_LABEL = {
  students: { fr: "l'élève", en: 'the student' },
  users: { fr: "l'utilisateur", en: 'the user' },
  classes: { fr: 'la classe', en: 'the class' },
  payments: { fr: 'le paiement', en: 'the payment' },
  grades: { fr: 'la note', en: 'the grade' },
  announcements: { fr: "l'annonce", en: 'the announcement' },
  enrollments: { fr: "l'inscription", en: 'the enrollment' },
  subjects: { fr: 'la matière', en: 'the subject' },
  academic_years: { fr: "l'année académique", en: 'the academic year' },
  periods: { fr: 'la période', en: 'the period' },
  sequences: { fr: 'la séquence', en: 'the sequence' },
  fees: { fr: 'les frais', en: 'the fee' },
  student_fees: { fr: 'les frais', en: 'the fee' },
  attendance: { fr: "l'assiduité", en: 'attendance' },
  exams: { fr: 'les examens', en: 'the exam' },
  exam_registrations: { fr: "une inscription d'examen", en: 'an exam registration' },
  class_subjects: { fr: 'les matières de classe', en: 'class subjects' },
  subject_teachers: { fr: 'une affectation de matière', en: 'a subject assignment' },
  class_teachers: { fr: 'un professeur principal', en: 'a class teacher' },
  guardians: { fr: 'un parent/tuteur', en: 'a guardian' },
  invites: { fr: 'une invitation', en: 'an invite' },
  system_levels: { fr: 'un niveau', en: 'a level' },
  system_series: { fr: 'une série', en: 'a series' },
  faculties: { fr: 'une faculté', en: 'a faculty' },
  departments: { fr: 'un département', en: 'a department' },
  programs: { fr: 'un programme', en: 'a program' },
  research_projects: { fr: 'un projet de recherche', en: 'a research project' },
  publications: { fr: 'une publication', en: 'a publication' },
  roles: { fr: 'un rôle', en: 'a role' },
  user_roles: { fr: 'un rôle', en: 'a role' },
  role_permissions: { fr: 'une permission', en: 'a permission' },
};
const DEFAULT_ENTITY_LABEL = { fr: 'un élément', en: 'an item' };

// ── Relative time helper ──
function timeAgo(dateStr, lang) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return lang === 'fr' ? "À l'instant" : 'Just now';
  if (diffMins < 60) return lang === 'fr' ? `Il y a ${diffMins} min` : `${diffMins}m ago`;
  if (diffHours < 24) return lang === 'fr' ? `Il y a ${diffHours}h` : `${diffHours}h ago`;
  if (diffDays < 7) return lang === 'fr' ? `Il y a ${diffDays}j` : `${diffDays}d ago`;
  return date.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' });
}

// ── Quick Action config ──
const QUICK_ACTIONS = [
  {
    label: 'Add Student',
    labelFr: 'Ajouter Étudiant',
    icon: FiPlus,
    path: '/dashboard/users/new',
    color: 'bg-primary-100 dark:bg-primary-900/30',
    iconColor: 'text-primary-600 dark:text-primary-400',
  },
  {
    label: 'Add Class',
    labelFr: 'Ajouter Classe',
    icon: FiBook,
    path: '/dashboard/classes/new',
    color: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  {
    label: 'Record Payment',
    labelFr: 'Enregistrer Paiement',
    icon: FiCreditCard,
    path: '/dashboard/payments',
    color: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    label: 'Generate Report',
    labelFr: 'Générer Rapport',
    icon: FiFileText,
    path: '/dashboard/report-cards',
    color: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
];

// ── Staff row for breakdown ──
function StaffRow({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12.5px] font-semibold text-surface-700 dark:text-surface-200">{label}</span>
          <span className="text-[12.5px] font-bold" style={{ color }}>{count}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-100 dark:bg-surface-700 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Revenue bar chart (Recharts BarChart) ──
function RevenueChart({ data, loading, lang, pc = '#085041' }) {
  const months = lang === 'fr' ? MONTHS_FR : MONTHS_EN;

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-surface-400">
        <FiDollarSign className="w-8 h-8 mb-2 opacity-40" />
        <p className="text-sm">{lang === 'fr' ? 'Aucune donnée de revenus' : 'No revenue data yet'}</p>
      </div>
    );
  }

  // Transform API rows ({ month: 'YYYY-MM-01T...', total }) into
  // Recharts-friendly points with localized month labels.
  const chartData = data.map((item) => {
    const date = new Date(item.month);
    return {
      name: months[date.getMonth()] || String(item.month || '').slice(0, 7),
      total: Number(item.total) || 0,
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: -14 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            tickLine={false}
            axisLine={false}
            width={42}
            tickFormatter={(v) =>
              v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`
            }
          />
          <Tooltip
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              return (
                <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl shadow-xl px-3 py-2">
                  <div className="text-[11px] font-semibold text-surface-500 dark:text-surface-400 mb-0.5">
                    {label}
                  </div>
                  <div className="text-[13px] font-bold" style={{ color: pc }}>
                    {formatCurrency(payload[0].value)}
                  </div>
                </div>
              );
            }}
          />
          <Bar
            dataKey="total"
            fill={pc}
            radius={[6, 6, 0, 0]}
            maxBarSize={42}
            animationDuration={700}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Activity item (real data from the audit trail, localized) ──
function ActivityItem({ activity, lang }) {
  const isFr = lang === 'fr';
  const entity = String(activity.entity || '').toLowerCase();
  const action = String(activity.action || '').toLowerCase();

  const config = ACTIVITY_ENTITY[entity] || FALLBACK_ACTIVITY;
  const Icon = config.icon;
  const verb = ACTIVITY_VERBS[action] || DEFAULT_VERB;
  const entityLabel = ACTIVITY_ENTITY_LABEL[entity] || DEFAULT_ENTITY_LABEL;
  const actor = activity.actorName || (isFr ? "Quelqu'un" : 'Someone');
  const target = activity.targetName ? ` — ${activity.targetName}` : '';

  const text = isFr
    ? `${actor} ${verb.fr} ${entityLabel.fr}${target}`
    : `${actor} ${verb.en} ${entityLabel.en}${target}`;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg} ${config.text}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-surface-800 dark:text-surface-100 truncate" title={text}>
          {text}
        </p>
        <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
          {timeAgo(activity.date, lang)}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { i18n } = useTranslation('common');
  const navigate = useNavigate();
  const { primaryColor } = useTheme();
  const lang = i18n.language === 'fr' ? 'fr' : 'en';
  const isFr = lang === 'fr';
  const pc = primaryColor || '#085041';

  // ── TanStack Query: 5-min cache + silent background refresh ──
  // On a return visit the data is served instantly from the cache; once stale,
  // it revalidates in the background without blocking the UI (no spinner loop).
  // Queries are keyed 'dashboard' so a manual refresh invalidates them all.
  // Stats follow the selected academic year (students/classes/teachers/revenue
  // are scoped to that year on the backend).
  const { academicYearId } = useYearFilter();
  const statsQuery = useQuery({
    queryKey: dashboardQueryKeys.stats(academicYearId),
    queryFn: () => getDashboardStats({ academicYearId }),
  });
  const activitiesQuery = useQuery({
    queryKey: dashboardQueryKeys.activities(academicYearId),
    queryFn: () => getRecentActivities({ academicYearId }),
  });
  const revenueQuery = useQuery({
    queryKey: dashboardQueryKeys.revenue(academicYearId),
    queryFn: () => getRevenueData({ academicYearId }),
  });

  const stats = statsQuery.data;
  const activities = activitiesQuery.data || [];
  const revenue = revenueQuery.data || [];
  // Show the loading skeleton only on the very first load — while ANY of the
  // three dashboard queries is still pending without cached data. Once cached,
  // revisits render instantly and refresh silently in the background.
  const loading =
    (statsQuery.isPending && !statsQuery.data) ||
    (activitiesQuery.isPending && !activitiesQuery.data) ||
    (revenueQuery.isPending && !revenueQuery.data);
  const chartLoading = revenueQuery.isPending && !revenueQuery.data;
  const fetchError = statsQuery.error || activitiesQuery.error || revenueQuery.error;
  const error = fetchError
    ? fetchError?.response?.data?.message || fetchError?.message || 'Failed to load dashboard'
    : null;

  // Manual refresh → revalidate every dashboard query in the background.
  const refreshDashboard = () => {
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-7 w-48 bg-surface-100 dark:bg-surface-700 rounded mb-2" />
          <div className="h-4 w-72 bg-surface-100 dark:bg-surface-700 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6 animate-pulse"
            >
              <div className="h-4 w-24 bg-surface-100 dark:bg-surface-700 rounded mb-3" />
              <div className="h-8 w-20 bg-surface-100 dark:bg-surface-700 rounded mb-2" />
              <div className="h-3 w-32 bg-surface-100 dark:bg-surface-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-4">
          <FiDollarSign className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
          {isFr ? 'Erreur de chargement' : 'Error loading dashboard'}
        </h3>
        <p className="text-sm text-surface-400 max-w-md mb-5">{error}</p>
        <button
          onClick={refreshDashboard}
          className="h-10 px-5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {isFr ? 'Réessayer' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Animated styles ── */}
      <style>{`
        @keyframes dashFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dashScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes dashCountUp {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes dashShimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes dashBarGrow {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        .dash-fade { animation: dashFadeUp 0.55s cubic-bezier(.16,1,.3,1) both; }
        .dash-scale { animation: dashScaleIn 0.45s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* ── Welcome Greeting ── */}
      <div className="dash-fade" style={{ animationDelay: '0s' }}>
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 dark:from-surface-900 dark:via-surface-800 dark:to-surface-900 rounded-2xl p-6 sm:p-8 shadow-lg">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/3 -translate-x-1/4" />
          
          <div className="relative z-10">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight mb-2">
                  {isFr ? 'Tableau de bord' : 'Dashboard'}
                </h1>
                <p className="text-primary-200/80 text-sm max-w-lg">
                  {stats
                    ? isFr
                      ? `${stats.totalStudents} étudiants · ${stats.totalTeachers} enseignants · ${stats.totalClasses} classes · ${stats.totalUsers} utilisateurs`
                      : `${stats.totalStudents} students · ${stats.totalTeachers} teachers · ${stats.totalClasses} classes · ${stats.totalUsers} users`
                    : isFr
                      ? "Vue d'ensemble de votre établissement"
                      : 'Overview of your institution'
                  }
                </p>
              </div>
              <button
                onClick={refreshDashboard}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all hover:scale-105"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
                {isFr ? 'Actualiser' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Students */}
          <div className="dash-scale bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5 shadow-sm cursor-default transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg" style={{ animationDelay: '0.04s' }}>
            <div className="relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[dashShimmer_2.5s_1s_ease-in-out]" />
              <div className="w-10 h-10 rounded-[11px] flex items-center justify-center mb-3.5" style={{ background: 'rgba(8,80,65,.07)' }}>
                <FiUsers className="w-5 h-5" style={{ color: '#085041' }} />
              </div>
              <div className="text-[clamp(22px,2.5vw,30px)] font-extrabold text-surface-800 dark:text-surface-100 leading-none mb-1 tabular-nums">
                {stats.totalStudents.toLocaleString()}
              </div>
              <div className="text-[12px] text-surface-400 font-medium">
                {isFr ? 'Total Étudiants' : 'Total Students'}
              </div>
              <div className="mt-3 pt-3 border-t border-surface-50 dark:border-surface-700/50">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                  <FiTrendingUp className="w-3 h-3" />
                  {stats.activeAcademicYear ? 'Année active' : 'Actif'}
                </span>
              </div>
            </div>
          </div>

          {/* Teachers */}
          <div className="dash-scale bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5 shadow-sm cursor-default transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg" style={{ animationDelay: '0.1s' }}>
            <div className="w-10 h-10 rounded-[11px] flex items-center justify-center mb-3.5" style={{ background: 'rgba(59,130,246,.08)' }}>
              <FiBookOpen className="w-5 h-5" style={{ color: '#3B82F6' }} />
            </div>
            <div className="text-[clamp(22px,2.5vw,30px)] font-extrabold text-surface-800 dark:text-surface-100 leading-none mb-1 tabular-nums">
              {stats.totalTeachers.toLocaleString()}
            </div>
            <div className="text-[12px] text-surface-400 font-medium">
              {isFr ? 'Total Enseignants' : 'Total Teachers'}
            </div>
            <div className="mt-3 pt-3 border-t border-surface-50 dark:border-surface-700/50">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                <FiShield className="w-3 h-3" />
                {stats.totalAccountants > 0 || stats.totalSecretaries > 0
                  ? `${stats.totalAccountants + stats.totalSecretaries} staff`
                  : isFr ? 'Personnel' : 'Staff'}
              </span>
            </div>
          </div>

          {/* Classes */}
          <div className="dash-scale bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5 shadow-sm cursor-default transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg" style={{ animationDelay: '0.16s' }}>
            <div className="w-10 h-10 rounded-[11px] flex items-center justify-center mb-3.5" style={{ background: 'rgba(245,158,11,.08)' }}>
              <FiBook className="w-5 h-5" style={{ color: '#F59E0B' }} />
            </div>
            <div className="text-[clamp(22px,2.5vw,30px)] font-extrabold text-surface-800 dark:text-surface-100 leading-none mb-1 tabular-nums">
              {stats.totalClasses.toLocaleString()}
            </div>
            <div className="text-[12px] text-surface-400 font-medium">
              {isFr ? 'Total Classes' : 'Total Classes'}
            </div>
            <div className="mt-3 pt-3 border-t border-surface-50 dark:border-surface-700/50">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                <FiLayers className="w-3 h-3" />
                {stats.totalStudents > 0 && stats.totalClasses > 0
                  ? `${Math.round(stats.totalStudents / stats.totalClasses)}/classe`
                  : isFr ? 'Niveaux' : 'Levels'}
              </span>
            </div>
          </div>

          {/* Revenue */}
          <div className="dash-scale bg-white dark:bg-surface-800 rounded-2xl border border-surface-100 dark:border-surface-700 p-5 shadow-sm cursor-default transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg" style={{ animationDelay: '0.22s' }}>
            <div className="w-10 h-10 rounded-[11px] flex items-center justify-center mb-3.5" style={{ background: 'rgba(124,58,237,.08)' }}>
              <FiDollarSign className="w-5 h-5" style={{ color: '#7C3AED' }} />
            </div>
            <div className="text-[clamp(18px,2.5vw,28px)] font-extrabold text-surface-800 dark:text-surface-100 leading-none mb-1 tabular-nums">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="text-[12px] text-surface-400 font-medium">
              {isFr ? 'Revenus Totaux' : 'Total Revenue'}
            </div>
            <div className="mt-3 pt-3 border-t border-surface-50 dark:border-surface-700/50">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                <FiTrendingUp className="w-3 h-3" />
                {stats.activeAcademicYear ? isFr ? 'Année active' : 'Active year' : isFr ? 'Temps réel' : 'Real-time'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 dash-fade" style={{ animationDelay: '0.1s' }}>
          <Card variant="default" className="h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <span className="w-[3px] h-[18px] rounded-sm" style={{ backgroundColor: pc }} />
                <h2 className="text-[15px] font-bold text-surface-800 dark:text-surface-100">
                  {isFr ? 'Revenus Mensuels' : 'Monthly Revenue'}
                </h2>
              </div>
              {revenue.length > 0 && (
                <span className="text-[11px] font-semibold text-surface-400 bg-surface-50 dark:bg-surface-700 px-2.5 py-1 rounded-full">
                  {isFr ? '6 derniers mois' : 'Last 6 months'}
                </span>
              )}
            </div>
            <RevenueChart data={revenue} loading={chartLoading} lang={lang} pc={pc} />
            {stats && (
              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-surface-100 dark:border-surface-700">
                <div className="text-center">
                  <div className="text-sm font-extrabold text-surface-800 dark:text-surface-100">
                    {formatCurrency(stats.totalRevenue)}
                  </div>
                  <div className="text-[11px] text-surface-400 mt-0.5">{isFr ? 'Total collecté' : 'Total collected'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-extrabold text-primary-600">
                    {stats.totalStudents > 0 ? `${Math.round((stats.totalRevenue / stats.totalStudents) / 1000)}K` : '—'}
                  </div>
                  <div className="text-[11px] text-surface-400 mt-0.5">{isFr ? 'Par étudiant' : 'Per student'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-extrabold text-teal-600">
                    {stats.totalUsers}
                  </div>
                  <div className="text-[11px] text-surface-400 mt-0.5">{isFr ? 'Utilisateurs' : 'Users'}</div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activities */}
        <div className="dash-fade" style={{ animationDelay: '0.2s' }}>
          <Card variant="default" padding="md" className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-[3px] h-[18px] rounded-sm" style={{ backgroundColor: pc }} />
                <h2 className="text-[15px] font-bold text-surface-800 dark:text-surface-100">
                  {isFr ? 'Activités Récentes' : 'Recent Activities'}
                </h2>
              </div>
              {activities.length > 0 && (
                <span className="text-[11px] font-semibold text-surface-400">{activities.length}</span>
              )}
            </div>

            <div className="flex-1 space-y-1">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center h-full">
                  <div className="w-12 h-12 rounded-full bg-surface-50 dark:bg-surface-700 flex items-center justify-center mb-3">
                    <FiCalendar className="w-5 h-5 text-surface-300 dark:text-surface-500" />
                  </div>
                  <p className="text-sm font-semibold text-surface-500 dark:text-surface-400">
                    {isFr ? 'Aucune activité' : 'No activities'}
                  </p>
                  <p className="text-xs text-surface-400 mt-1">
                    {isFr ? 'Les activités récentes apparaîtront ici' : 'Recent activities will appear here'}
                  </p>
                </div>
              ) : (
                activities.slice(0, 5).map((activity, idx) => (
                  <ActivityItem key={idx} activity={activity} lang={lang} />
                ))
              )}
            </div>

            {activities.length > 5 && (
              <button className="w-full mt-auto pt-3 py-2 text-xs font-semibold text-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/10 rounded-lg transition-colors flex items-center justify-center gap-1 border-t border-surface-100 dark:border-surface-700">
                {isFr ? 'Voir toutes les activités' : 'View all activities'}
                <FiArrowRight className="w-3 h-3" />
              </button>
            )}
          </Card>
        </div>
      </div>

      {/* ── Secondary Row: Staff Breakdown + Quick Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff breakdown */}
        <div className="dash-fade" style={{ animationDelay: '0.3s' }}>
          <Card variant="default" padding="md">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-[3px] h-[18px] rounded-sm" style={{ backgroundColor: pc }} />
              <h2 className="text-[15px] font-bold text-surface-800 dark:text-surface-100">
                {isFr ? 'Répartition du Personnel' : 'Staff Breakdown'}
              </h2>
            </div>
            {stats ? (
              <div className="space-y-3">
                <StaffRow
                  label={isFr ? 'Administrateurs' : 'Admins'}
                  count={1}
                  total={stats.totalUsers}
                  color="#085041"
                />
                <StaffRow
                  label={isFr ? 'Enseignants' : 'Teachers'}
                  count={stats.totalTeachers}
                  total={stats.totalUsers}
                  color="#3B82F6"
                />
                <StaffRow
                  label={isFr ? 'Étudiants' : 'Students'}
                  count={stats.totalStudents}
                  total={stats.totalUsers + stats.totalStudents}
                  color="#8B5CF6"
                />
                <StaffRow
                  label={isFr ? 'Comptables' : 'Accountants'}
                  count={stats.totalAccountants}
                  total={stats.totalUsers}
                  color="#F59E0B"
                />
                <StaffRow
                  label={isFr ? 'Secrétaires' : 'Secretaries'}
                  count={stats.totalSecretaries}
                  total={stats.totalUsers}
                  color="#EC4899"
                />
                {stats.totalParents > 0 && (
                  <StaffRow
                    label={isFr ? 'Parents' : 'Parents'}
                    count={stats.totalParents}
                    total={stats.totalUsers}
                    color="#14B8A6"
                  />
                )}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center">
                <Spinner size="md" color="primary" />
              </div>
            )}
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 dash-fade" style={{ animationDelay: '0.35s' }}>
          <Card variant="default" padding="md" className="h-full">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="w-[3px] h-[18px] rounded-sm" style={{ backgroundColor: pc }} />
              <h2 className="text-[15px] font-bold text-surface-800 dark:text-surface-100">
                {isFr ? 'Actions Rapides' : 'Quick Actions'}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-2.5 p-4 bg-surface-50 dark:bg-surface-900 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-all duration-200 group hover:-translate-y-1 hover:shadow-md"
                  style={{ animationDelay: `${0.4 + idx * 0.05}s` }}
                >
                  <div
                    className={`w-11 h-11 rounded-full ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                  >
                    <action.icon className={`w-5 h-5 ${action.iconColor}`} />
                  </div>
                  <span className="text-xs font-semibold text-surface-600 dark:text-surface-300 text-center leading-tight">
                    {isFr ? action.labelFr : action.label}
                  </span>
                </button>
              ))}
            </div>
            {/* Mini info badges */}
            <div className="mt-5 pt-4 border-t border-surface-100 dark:border-surface-700 flex flex-wrap gap-2">
              {stats?.activeAcademicYear && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-2.5 py-1 rounded-full">
                  <FiCheckCircle className="w-3 h-3" />
                  {isFr ? 'Année académique active' : 'Academic year active'}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-surface-500 dark:text-surface-400 bg-surface-50 dark:bg-surface-700 px-2.5 py-1 rounded-full">
                <FiClock className="w-3 h-3" />
                {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
