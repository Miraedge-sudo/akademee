import { useState, useEffect } from "react";
import { useTheme } from "../../../core/hooks/useTheme";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import {
  FiDollarSign,
  FiPlus,
  FiLayers,
  FiFile,
  FiBarChart2,
  FiUsers,
  FiHome,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import { getFinanceStats } from "../../../core/api/dashboardService";
import { getPayments } from "../../../core/api/paymentService";
import FinanceStatCards from "../../accountant/components/FinanceStatCards";
import MonthlyCollectionsChart from "../../accountant/components/MonthlyCollectionsChart";
import FeeCollectionByClass from "../../accountant/components/FeeCollectionByClass";
import OutstandingAlerts from "../../accountant/components/OutstandingAlerts";
import RecentPayments from "../../accountant/components/RecentPayments";
import FeeStatusDonut from "../../accountant/components/FeeStatusDonut";

function hexToRgba(hex, alpha = 1) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (r) return `rgba(${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}, ${alpha})`;
  return `rgba(8, 80, 65, ${alpha})`;
}

export default function FinancePage() {
  const { primaryColor } = useTheme();
  const { user } = useAuth();
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const isFr = i18n.language === "fr";
  const pc = primaryColor || "#085041";

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [financeStats, setFinanceStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
        const [financeData, paymentsData] = await Promise.all([
          getFinanceStats().catch(() => null),
          getPayments({ limit: 10 }).catch(() => ({ payments: [] })),
        ]);
        if (!mounted) return;

        if (financeData) setFinanceStats(financeData);

        const totalCollected = financeData?.totalCollected ?? 0;
        const outstanding = financeData?.outstanding ?? 0;
        const collectionRate = financeData?.collectionRate ?? 0;

        setStats({
          totalCollected,
          outstanding,
          collectionRate,
          paymentsToday: financeData?.feeStatusOverview?.paid || 0,
          totalStudents: financeData?.feeStatusOverview
            ? financeData.feeStatusOverview.paid + financeData.feeStatusOverview.partial + financeData.feeStatusOverview.unpaid
            : 0,
          totalClasses: financeData?.collectionByClass?.length || 0,
        });

        const paymentsList = Array.isArray(paymentsData)
          ? paymentsData
          : (paymentsData?.payments || []);
        setRecentPayments(
          paymentsList.slice(0, 5).map((p) => ({
            id: p.id,
            name: p.studentName || "Student",
            cls: p.className || "",
            amount: Number(p.amount) || 0,
            method: p.method || "Cash",
            avatarBg: "#E1F5EE",
            avatarText: "#085041",
          }))
        );
      } catch {
        if (mounted) {
          setStats({ totalCollected: 0, outstanding: 0, collectionRate: 0, paymentsToday: 0, totalStudents: 0, totalClasses: 0 });
        }
      }
      if (mounted) setLoading(false);
    }
    fetchData();
    return () => { mounted = false; };
  }, []);

  const unpaidCount = financeStats?.feeStatusOverview?.unpaid ?? 0;
  const monthRevenue = stats?.totalCollected ? Math.round(stats.totalCollected / 6) : 0;

  const quickActions = [
    {
      label: isFr ? "Gérer les frais" : "Manage fees",
      desc: isFr ? "Créer et modifier les types de frais" : "Create and edit fee types",
      path: "/dashboard/fees",
      icon: FiDollarSign,
      color: pc,
      bg: hexToRgba(pc, 0.08),
    },
    {
      label: isFr ? "Assigner des frais" : "Assign fees",
      desc: isFr ? "Attribuer des frais aux classes" : "Assign fees to classes",
      path: "/dashboard/fees/assign",
      icon: FiLayers,
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.08)",
    },
    {
      label: isFr ? "Enregistrer un paiement" : "Record payment",
      desc: isFr ? "Saisir un paiement d'élève" : "Record a student payment",
      path: "/dashboard/payments",
      icon: FiPlus,
      color: "#1D9E75",
      bg: "rgba(29,158,117,0.08)",
    },
    {
      label: isFr ? "Reçus de paiement" : "Payment receipts",
      desc: isFr ? "Consulter et imprimer les reçus" : "View and print receipts",
      path: "/dashboard/receipts",
      icon: FiFile,
      color: "#8B5CF6",
      bg: "rgba(139,92,246,0.08)",
    },
  ];

  const statLinks = [
    {
      label: isFr ? "Total élèves" : "Total students",
      value: stats?.totalStudents || 0,
      icon: FiUsers,
      color: "#1D9E75",
    },
    {
      label: isFr ? "Total classes" : "Total classes",
      value: stats?.totalClasses || 0,
      icon: FiHome,
      color: "#0EA5E9",
    },
    {
      label: isFr ? "Impayés" : "Outstanding",
      value: unpaidCount,
      icon: FiBarChart2,
      color: "#EF4444",
    },
    {
      label: isFr ? "Taux de recouvrement" : "Collection rate",
      value: `${stats?.collectionRate || 0}%`,
      icon: FiClock,
      color: pc,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 rounded-full border-[3px] border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Animations ── */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.55s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* ── Header ── */}
      <div
        className="fade-up relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/2" />

        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <FiDollarSign className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight">
                  {isFr ? "Finance" : "Finance"}
                </h1>
                <p className="text-white/70 text-sm mt-0.5">
                  {isFr ? "Vue d'ensemble financière de l'établissement" : "School financial overview"}
                </p>
              </div>
            </div>
          </div>

          {/* Quick stat badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {statLinks.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2"
              >
                <s.icon className="w-3.5 h-3.5 text-white/70" />
                <div>
                  <span className="text-sm font-bold text-white">{s.value}</span>
                  <span className="text-[10px] text-white/50 ml-1">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="fade-up grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ animationDelay: "0.06s" }}>
        {quickActions.map((action, i) => (
          <Link
            key={action.path}
            to={action.path}
            className="group bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-200"
              style={{ background: action.bg }}
            >
              <action.icon className="w-4.5 h-4.5" style={{ color: action.color, strokeWidth: 1.8 }} />
            </div>
            <div className="text-[13px] font-bold text-surface-800 dark:text-surface-100 mb-0.5">
              {action.label}
            </div>
            <div className="text-[11px] text-surface-400 leading-tight">{action.desc}</div>
          </Link>
        ))}
      </div>

      {/* ── KPI Cards ── */}
      <div className="fade-up" style={{ animationDelay: "0.1s" }}>
        <FinanceStatCards stats={stats} />
      </div>

      {/* ── Charts Row ── */}
      <div className="fade-up grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4" style={{ animationDelay: "0.14s" }}>
        <MonthlyCollectionsChart
          data={financeStats?.monthlyCollections}
          totalCollected={financeStats?.totalCollected}
          outstanding={financeStats?.outstanding}
          collectionRate={financeStats?.collectionRate}
        />
        <FeeCollectionByClass classes={financeStats?.collectionByClass} />
      </div>

      {/* ── Alerts + Recent + Donut ── */}
      <div className="fade-up grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4" style={{ animationDelay: "0.18s" }}>
        <OutstandingAlerts defaulters={financeStats?.outstandingAlerts} />

        <div className="flex flex-col gap-4">
          <RecentPayments payments={recentPayments} />
          <FeeStatusDonut data={financeStats?.feeStatusOverview} />
        </div>
      </div>

      {/* ── Year Summary ── */}
      <div className="fade-up bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm" style={{ animationDelay: "0.22s" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
            <span className="w-[3px] h-[18px] rounded" style={{ backgroundColor: pc }} />
            {isFr ? "Résumé financier" : "Financial summary"}
          </div>
          <div className="flex items-center gap-1 text-xs text-surface-400">
            <FiCalendar className="w-3 h-3" />
            {new Date().toLocaleDateString(isFr ? "fr" : "en", { month: "long", year: "numeric" })}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-surface-50 dark:bg-surface-900 rounded-xl p-4 border border-surface-100 dark:border-surface-700">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-1">
              {isFr ? "Total collecté" : "Total collected"}
            </p>
            <p className="text-lg font-extrabold text-surface-900 dark:text-surface-100">
              {(financeStats?.totalCollected || 0).toLocaleString("fr")} <span className="text-[11px] font-medium text-surface-400">FCFA</span>
            </p>
          </div>
          <div className="bg-surface-50 dark:bg-surface-900 rounded-xl p-4 border border-surface-100 dark:border-surface-700">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-1">
              {isFr ? "Impayés" : "Outstanding"}
            </p>
            <p className="text-lg font-extrabold text-red-500">
              {(financeStats?.outstanding || 0).toLocaleString("fr")} <span className="text-[11px] font-medium text-surface-400">FCFA</span>
            </p>
          </div>
          <div className="bg-surface-50 dark:bg-surface-900 rounded-xl p-4 border border-surface-100 dark:border-surface-700">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-1">
              {isFr ? "Taux de recouvrement" : "Collection rate"}
            </p>
            <p className="text-lg font-extrabold" style={{ color: pc }}>
              {financeStats?.collectionRate || 0}%
            </p>
          </div>
          <div className="bg-surface-50 dark:bg-surface-900 rounded-xl p-4 border border-surface-100 dark:border-surface-700">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 mb-1">
              {isFr ? "Élèves suivis" : "Students tracked"}
            </p>
            <p className="text-lg font-extrabold text-surface-900 dark:text-surface-100">
              {(() => {
                const o = financeStats?.feeStatusOverview;
                return o ? (o.paid || 0) + (o.partial || 0) + (o.unpaid || 0) : 0;
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
