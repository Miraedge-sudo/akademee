import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const StatCard = ({ title, value, icon, color, trend, lang }) => (
  <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
          {title}
        </p>
        <p className="text-2xl font-bold text-surface-800 dark:text-surface-100">
          {value}
        </p>
        {trend && (
          <p
            className={`text-xs mt-2 ${trend.positive ? "text-green-600" : "text-red-600"}`}
          >
            {trend.positive ? "+" : ""}
            {trend.value}% {lang === "fr" ? "vs mois dernier" : "vs last month"}
          </p>
        )}
      </div>
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { i18n } = useTranslation("common");
  const lang = i18n.language === "fr" ? "fr" : "en";

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalRevenue: 0,
  });
  const [activities, setActivities] = useState([]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        // Pour l'instant, utilise des données mockées car le backend n'a pas encore les endpoints
        // TODO: Remplacer par les vrais appels API quand le backend sera prêt
        // const statsData = await getDashboardStats();
        // const activitiesData = await getRecentActivities();

        // Données mockées pour le développement
        setStats({
          totalStudents: 1234,
          totalTeachers: 89,
          totalClasses: 45,
          totalRevenue: 15000000,
        });

        setActivities([
          {
            id: 1,
            type: "student",
            message: "New student registered: John Doe",
            time: "2 hours ago",
          },
          {
            id: 2,
            type: "payment",
            message: "Payment received: 500,000 XAF",
            time: "3 hours ago",
          },
          {
            id: 3,
            type: "class",
            message: "New class created: Form 1A",
            time: "5 hours ago",
          },
          {
            id: 4,
            type: "teacher",
            message: "Teacher assigned: Mr. Smith to Mathematics",
            time: "6 hours ago",
          },
        ]);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <svg
          className="animate-spin h-8 w-8 text-primary-600"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-surface-800 dark:text-surface-100">
          {lang === "fr" ? "Tableau de bord" : "Dashboard"}
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
          {lang === "fr"
            ? "Vue d'ensemble de votre établissement"
            : "Overview of your institution"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={lang === "fr" ? "Total Étudiants" : "Total Students"}
          value={stats.totalStudents.toLocaleString()}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-6 h-6 text-white"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
          color="bg-primary-600"
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title={lang === "fr" ? "Total Enseignants" : "Total Teachers"}
          value={stats.totalTeachers.toLocaleString()}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-6 h-6 text-white"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
          color="bg-green-600"
          trend={{ value: 5, positive: true }}
        />
        <StatCard
          title={lang === "fr" ? "Total Classes" : "Total Classes"}
          value={stats.totalClasses.toLocaleString()}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-6 h-6 text-white"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          }
          color="bg-amber-600"
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title={lang === "fr" ? "Revenus Totaux" : "Total Revenue"}
          value={formatCurrency(stats.totalRevenue)}
          icon={
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-6 h-6 text-white"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
          color="bg-purple-600"
          trend={{ value: 23, positive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100">
              {lang === "fr" ? "Revenus Mensuels" : "Monthly Revenue"}
            </h2>
            <select className="px-3 py-1.5 text-sm bg-surface-100 dark:bg-surface-700 border border-surface-200 dark:border-surface-700 rounded-lg text-surface-700 dark:text-surface-200">
              <option>{lang === "fr" ? "Cette année" : "This Year"}</option>
              <option>
                {lang === "fr" ? "L'année dernière" : "Last Year"}
              </option>
            </select>
          </div>

          {/* Simple bar chart representation */}
          <div className="h-64 flex items-end justify-between gap-2">
            {[
              { month: lang === "fr" ? "Jan" : "Jan", value: 65 },
              { month: lang === "fr" ? "Fév" : "Feb", value: 80 },
              { month: lang === "fr" ? "Mar" : "Mar", value: 55 },
              { month: lang === "fr" ? "Avr" : "Apr", value: 90 },
              { month: lang === "fr" ? "Mai" : "May", value: 70 },
              { month: lang === "fr" ? "Juin" : "Jun", value: 85 },
              { month: lang === "fr" ? "Juil" : "Jul", value: 60 },
              { month: lang === "fr" ? "Août" : "Aug", value: 75 },
              { month: lang === "fr" ? "Sep" : "Sep", value: 95 },
              { month: lang === "fr" ? "Oct" : "Oct", value: 88 },
              { month: lang === "fr" ? "Nov" : "Nov", value: 72 },
              { month: lang === "fr" ? "Déc" : "Dec", value: 82 },
            ].map((item, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div
                  className="w-full bg-primary-600 rounded-t-lg transition-all hover:bg-primary-700"
                  style={{ height: `${item.value}%` }}
                />
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  {item.month}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-6">
            {lang === "fr" ? "Activités Récentes" : "Recent Activities"}
          </h2>

          <div className="space-y-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 hover:bg-surface-50 dark:hover:bg-surface-900/50 rounded-lg transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === "student"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : activity.type === "payment"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                        : activity.type === "class"
                          ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                          : "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  }`}
                >
                  {activity.type === "student" && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-4 h-4"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                  {activity.type === "payment" && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-4 h-4"
                    >
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  )}
                  {activity.type === "class" && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-4 h-4"
                    >
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                  )}
                  {activity.type === "teacher" && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="w-4 h-4"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-800 dark:text-surface-100 truncate">
                    {activity.message}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
            {lang === "fr" ? "Voir tout" : "View All"}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100 mb-4">
          {lang === "fr" ? "Actions Rapides" : "Quick Actions"}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 bg-surface-50 dark:bg-surface-900 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5 text-primary-600 dark:text-primary-400"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
              {lang === "fr" ? "Ajouter Étudiant" : "Add Student"}
            </span>
          </button>

          <button className="flex flex-col items-center gap-2 p-4 bg-surface-50 dark:bg-surface-900 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5 text-green-600 dark:text-green-400"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
              {lang === "fr" ? "Ajouter Classe" : "Add Class"}
            </span>
          </button>

          <button className="flex flex-col items-center gap-2 p-4 bg-surface-50 dark:bg-surface-900 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5 text-amber-600 dark:text-amber-400"
              >
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
              {lang === "fr" ? "Enregistrer Paiement" : "Record Payment"}
            </span>
          </button>

          <button className="flex flex-col items-center gap-2 p-4 bg-surface-50 dark:bg-surface-900 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-xl transition-colors">
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5 text-purple-600 dark:text-purple-400"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
              {lang === "fr" ? "Générer Rapport" : "Generate Report"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
