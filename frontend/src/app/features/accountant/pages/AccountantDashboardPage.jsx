/**
 * AccountantDashboardPage — Finance dashboard for the accountant role.
 *
 * Architecture:
 *  - Route: /dashboard/accountant-home  (registered in App.jsx)
 *  - Wrapped by AdminLayout via <Outlet />
 *  - Sub-components in ../components/
 *  - Uses useAuth for user context and useTheme for the primary brand colour
 *  - All data is mock — replace with real API calls when endpoints are ready
 */
import { useTheme } from '../../../core/hooks/useTheme';
import { useAuth } from '../../../core/hooks/useAuth';
import AccountantGreeting    from '../components/AccountantGreeting';
import FinanceStatCards      from '../components/FinanceStatCards';
import MonthlyCollectionsChart from '../components/MonthlyCollectionsChart';
import FeeCollectionByClass  from '../components/FeeCollectionByClass';
import OutstandingAlerts     from '../components/OutstandingAlerts';
import RecentPayments        from '../components/RecentPayments';
import FeeStatusDonut        from '../components/FeeStatusDonut';

// ── Mock data (replace with API call when available) ──
const MOCK_STATS = {
  totalCollected:  7200000,
  outstanding:     2640000,
  collectionRate:  73,
  paymentsToday:   8,
};

export default function AccountantDashboardPage() {
  const { primaryColor } = useTheme();
  const { user } = useAuth();
  const pc = primaryColor || '#085041';

  return (
    <div className="space-y-5">
      <AccountantGreeting
        unpaidCount={47}
        monthRevenue={1240000}
        pc={pc}
      />

      <FinanceStatCards stats={MOCK_STATS} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <MonthlyCollectionsChart />
        <FeeCollectionByClass />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
        <OutstandingAlerts />

        <div className="flex flex-col gap-4">
          <RecentPayments />
          <FeeStatusDonut />
        </div>
      </div>
    </div>
  );
}
