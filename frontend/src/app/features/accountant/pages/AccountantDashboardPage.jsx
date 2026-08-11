/**
 * AccountantDashboardPage — Finance dashboard for the accountant role.
 *
 * Architecture:
 *  - Route: /dashboard/accountant-home  (registered in App.jsx)
 *  - Wrapped by AdminLayout via <Outlet />
 *  - Sub-components in ../components/
 *  - Uses useTheme for the primary brand colour
 *  - Fetches real data from dashboard stats, payment, and fee APIs
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FiDownload, FiFileText, FiLoader } from 'react-icons/fi';
import { useTheme } from '../../../core/hooks/useTheme';
import { getDashboardStats, getFinanceStats, downloadFinancialStatementPdf } from '../../../core/api/dashboardService';
import { saveBlobAs } from '../../../core/api/reportCardsService';
import { getPayments, getTodayPayments } from '../../../core/api/paymentService';
import AccountantGreeting    from '../components/AccountantGreeting';
import FinanceStatCards      from '../components/FinanceStatCards';
import MonthlyCollectionsChart from '../components/MonthlyCollectionsChart';
import FeeCollectionByClass  from '../components/FeeCollectionByClass';
import OutstandingAlerts     from '../components/OutstandingAlerts';
import RecentPayments        from '../components/RecentPayments';
import FeeStatusDonut        from '../components/FeeStatusDonut';

export default function AccountantDashboardPage() {
  const { primaryColor } = useTheme();
  const pc = primaryColor || '#085041';

  const [stats, setStats] = useState(null);
  const [financeStats, setFinanceStats] = useState(null);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { i18n } = useTranslation();
  const isFr = i18n.language === "fr";

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      try {
        const [dashboardData, financeData, paymentsData, todayPaymentsData] = await Promise.all([
          getDashboardStats().catch(() => null),
          getFinanceStats().catch(() => null),
          getPayments({ limit: 10 }).catch(() => ({ payments: [] })),
          getTodayPayments().catch(() => ({ payments: [] })),
        ]);

        if (!mounted) return;

        // Finance stats from the dedicated API
        if (financeData) {
          setFinanceStats(financeData);
        }

        const totalCollected = (financeData?.totalCollected ?? dashboardData?.totalRevenue) || 0;
        const outstanding = financeData?.outstanding ?? 0;
        const collectionRate = financeData?.collectionRate ?? 0;

        const paymentsList = Array.isArray(paymentsData)
          ? paymentsData
          : (paymentsData?.payments || []);
        const todayPaymentsList = Array.isArray(todayPaymentsData)
          ? todayPaymentsData
          : (todayPaymentsData?.payments || []);

        setStats({
          totalCollected,
          outstanding,
          collectionRate,
          paymentsToday: todayPaymentsList.length,
          totalStudents: dashboardData?.totalStudents || 0,
          totalClasses: dashboardData?.totalClasses || 0,
        });

        // Map payments for RecentPayments component
        setRecentPayments(
          paymentsList.slice(0, 5).map((p) => ({
            id: p.id,
            name: p.studentName || 'Student',
            cls: p.className || '',
            amount: Number(p.amount) || 0,
            method: p.method || 'Cash',
            avatarBg: '#E1F5EE',
            avatarText: '#085041',
          }))
        );
      } catch {
        // If API calls fail, use fallback defaults
        if (mounted) {
          setStats({
            totalCollected: 0,
            outstanding: 0,
            collectionRate: 0,
            paymentsToday: 0,
            totalStudents: 0,
            totalClasses: 0,
          });
        }
      }
      if (mounted) setLoading(false);
    }

    fetchData();
    return () => { mounted = false; };
  }, []);

  /**
   * Download the server-rendered "financial state of the campus" PDF so the
   * accountant can print it and hand it to the administration.
   */
  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const { blob, filename } = await downloadFinancialStatementPdf(isFr ? 'fr' : 'en');
      saveBlobAs(blob, filename);
      toast.success(isFr ? 'Situation financière téléchargée.' : 'Financial statement downloaded.');
    } catch (err) {
      console.error('[FinancialStatement] Download failed:', err);
      toast.error(
        err.response?.data?.message ||
        err.message ||
        (isFr ? 'Échec du téléchargement du PDF' : 'Failed to download the PDF')
      );
    } finally {
      setDownloading(false);
    }
  };

  const unpaidCount = financeStats?.feeStatusOverview
    ? financeStats.feeStatusOverview.unpaid
    : (stats?.totalStudents ? Math.round(stats.totalStudents * 0.3) : 0);
  const monthRevenue = stats?.totalCollected
    ? Math.round(stats.totalCollected / 6)
    : 0;

  return (
    <div className="space-y-5">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-surface-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <AccountantGreeting
            unpaidCount={unpaidCount}
            monthRevenue={monthRevenue}
            pc={pc}
          />

          {/* Financial statement PDF — for the administration */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 animate-[fadeUp_.55s_.12s_cubic-bezier(.16,1,.3,1)_both]">
            <p className="text-[13px] text-surface-500 dark:text-surface-400 flex items-center gap-2">
              <FiFileText className="text-teal-600" size={15} />
              {isFr
                ? "Situation financière du campus — prête à être transmise à l'administration."
                : "Campus financial statement — ready to hand to the administration."}
            </p>
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: pc }}
            >
              {downloading ? (
                <FiLoader size={15} className="animate-spin" />
              ) : (
                <FiDownload size={15} />
              )}
              {downloading
                ? (isFr ? 'Génération du PDF…' : 'Generating PDF…')
                : (isFr ? 'Télécharger le PDF' : 'Download PDF')}
            </button>
          </div>

          <FinanceStatCards stats={stats} />

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
            <MonthlyCollectionsChart
              data={financeStats?.monthlyCollections}
              totalCollected={financeStats?.totalCollected}
              outstanding={financeStats?.outstanding}
              collectionRate={financeStats?.collectionRate}
            />
            <FeeCollectionByClass
              classes={financeStats?.collectionByClass}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
            <OutstandingAlerts
              defaulters={financeStats?.outstandingAlerts}
            />

            <div className="flex flex-col gap-4">
              <RecentPayments payments={recentPayments} />
              <FeeStatusDonut
                data={financeStats?.feeStatusOverview}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
