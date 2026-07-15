import { useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { YearContext } from '../../../core/context/YearContext';
import {
  FiUsers,
  FiUser,
  FiBook,
  FiDollarSign,
  FiPlus,
  FiFileText,
  FiCreditCard,
  FiArrowRight,
  FiCalendar,
  FiStar,
  FiBarChart2,
} from 'react-icons/fi';
import {
  getDashboardStats,
  getRecentActivities,
  getRevenueData,
} from '../../../core/api/dashboardService';
import { useTheme } from '../../../core/hooks/useTheme';
import StatCard from '../../../components/ui/StatCard';
import PageHeader from '../../../components/ui/PageHeader';
import Spinner from '../../../components/ui/Spinner';
import Card from '../../../components/ui/Card';
import { hexToRgba, formatCurrency } from '../../../components/utils/colors';

// ── Month name short mapping ──
const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// ── Activity icon/color mapping ──
const ACTIVITY_CONFIG = {
  student_created: {
    icon: FiUser,
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
  },
  payment_received: {
    icon: FiDollarSign,
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400',
  },
  grade_recorded: {
    icon: FiStar,
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
  },
};

// ── Fallback icon for unknown activity types ──
const FALLBACK_ACTIVITY = {
  icon: FiCalendar,
  bg: 'bg-surface-100 dark:bg-surface-700',
  text: 'text-surface-600 dark:text-surface-400',
};

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
    path: '/dashboard/students',
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
    path: '/dashboard/finance',
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

// ── Revenue bar chart ──
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

  const maxValue = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="h-64 flex items-end justify-between gap-1.5">
      {data.map((item, idx) => {
        const date = new Date(item.month);
        const monthLabel = months[date.getMonth()];
        const heightPct = (item.total / maxValue) * 100;
        const isMax = item.total === maxValue;

        return (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
            <span className="text-[10px] font-semibold text-surface-500 dark:text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatCurrency(item.total)}
            </span>
            <div
              className="w-full rounded-t-md transition-all duration-300 group-hover:brightness-110"
              style={{
                height: `${Math.max(heightPct, 4)}%`,
                background: isMax
                  ? `linear-gradient(180deg, ${pc}, ${hexToRgba(pc, 0.53)})`
                  : `linear-gradient(180deg, ${hexToRgba(pc, 0.53)}, ${hexToRgba(pc, 0.27)})`,
              }}
            />
            <span className="text-[10px] text-surface-500 dark:text-surface-400 font-medium">
              {monthLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Activity item ──
function ActivityItem({ activity, lang }) {
  const config = ACTIVITY_CONFIG[activity.type] || FALLBACK_ACTIVITY;
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg} ${config.text}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-surface-800 dark:text-surface-100 truncate">
          {activity.description}
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const { selectedYearId } = useContext(YearContext);

  const loadDashboardData = useCallback(async (yearId) => {
    setLoading(true);
    setError(null);
    try {
      const params = yearId ? { academicYearId: yearId } : {};
      const [statsData, activitiesData, revenueData] = await Promise.all([
        getDashboardStats(params),
        getRecentActivities(params),
        getRevenueData(params),
      ]);
      setStats(statsData);
      setActivities(activitiesData || []);
      setRevenue(revenueData || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(selectedYearId);
  }, [loadDashboardData, selectedYearId]);

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
          onClick={() => loadDashboardData(selectedYearId)}
          className="h-10 px-5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {isFr ? 'Réessayer' : 'Retry'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <PageHeader
        icon={<FiBarChart2 className="w-6 h-6" />}
        title={isFr ? 'Tableau de bord' : 'Dashboard'}
        subtitle={
          stats
            ? isFr
              ? `${stats.totalStudents} étudiants · ${stats.totalTeachers} enseignants · ${stats.totalClasses} classes`
              : `${stats.totalStudents} students · ${stats.totalTeachers} teachers · ${stats.totalClasses} classes`
            : isFr
              ? "Vue d'ensemble de votre établissement"
              : 'Overview of your institution'
        }
        color={pc}
      />

      {/* ── Stats Cards ── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<FiUsers className="w-6 h-6" />}
            value={stats.totalStudents.toLocaleString()}
            label={isFr ? 'Total Étudiants' : 'Total Students'}
            color="#085041"
          />
          <StatCard
            icon={<FiUser className="w-6 h-6" />}
            value={stats.totalTeachers.toLocaleString()}
            label={isFr ? 'Total Enseignants' : 'Total Teachers'}
            color="#1D9E75"
          />
          <StatCard
            icon={<FiBook className="w-6 h-6" />}
            value={stats.totalClasses.toLocaleString()}
            label={isFr ? 'Total Classes' : 'Total Classes'}
            color="#F59E0B"
          />
          <StatCard
            icon={<FiDollarSign className="w-6 h-6" />}
            value={formatCurrency(stats.totalRevenue)}
            label={isFr ? 'Revenus Totaux' : 'Total Revenue'}
            color="#7C3AED"
          />
        </div>
      )}

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card variant="default" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100">
              {isFr ? 'Revenus Mensuels' : 'Monthly Revenue'}
            </h2>
            {revenue.length > 0 && (
              <span className="text-xs font-medium text-surface-400">
                {isFr ? '6 derniers mois' : 'Last 6 months'}
              </span>
            )}
          </div>
          <RevenueChart data={revenue} loading={chartLoading} lang={lang} pc={pc} />
        </Card>

        {/* Recent Activities */}
        <Card variant="default" padding="md">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100">
              {isFr ? 'Activités Récentes' : 'Recent Activities'}
            </h2>
          </div>

          <div className="space-y-1">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FiCalendar className="w-8 h-8 text-surface-300 dark:text-surface-600 mb-2" />
                <p className="text-sm text-surface-400">
                  {isFr ? 'Aucune activité récente' : 'No recent activities'}
                </p>
              </div>
            ) : (
              activities.slice(0, 6).map((activity, idx) => (
                <ActivityItem key={idx} activity={activity} lang={lang} />
              ))
            )}
          </div>

          {activities.length > 6 && (
            <button className="w-full mt-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors flex items-center justify-center gap-1">
              {isFr ? 'Voir tout' : 'View All'}
              <FiArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </Card>
      </div>

      {/* ── Quick Actions ── */}
      <Card variant="default">
        <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-4">
          {isFr ? 'Actions Rapides' : 'Quick Actions'}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-2 p-4 bg-surface-50 dark:bg-surface-900 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors group"
            >
              <div
                className={`w-10 h-10 rounded-full ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}
              >
                <action.icon className={`w-5 h-5 ${action.iconColor}`} />
              </div>
              <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                {isFr ? action.labelFr : action.label}
              </span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
