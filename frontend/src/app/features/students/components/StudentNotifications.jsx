/**
 * StudentNotifications — list of recent notifications.
 */
import { Bell, CreditCard, Calendar } from 'lucide-react';

const ICON_MAP = {
  bell: Bell,
  'credit-card': CreditCard,
  calendar: Calendar,
};

const SAMPLE_NOTIFS = [
  { icon: 'bell',        title: 'Sequence 3 results published',          time: 'Today, 08:00', iconBg: 'var(--teal-50)', iconColor: '#085041', unread: true },
  { icon: 'credit-card', title: 'Payment reminder — 40 000 FCFA due',   time: 'Yesterday',    iconBg: 'rgba(245,158,11,.08)', iconColor: '#F59E0B', unread: true },
  { icon: 'calendar',    title: 'Academic calendar update — Term 2 dates', time: '3 days ago',   iconBg: 'rgba(59,130,246,.08)', iconColor: '#3B82F6', unread: false },
];

export default function StudentNotifications({ notifications = SAMPLE_NOTIFS }) {
  const hasUnread = notifications.some((n) => n.unread);

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm flex-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Notifications
        </div>
        {hasUnread && (
          <div className="w-[7px] h-[7px] rounded-full bg-red-500 animate-pulse" />
        )}
      </div>

      <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
        {notifications.map((n, i) => {
          const Icon = ICON_MAP[n.icon] || Bell;
          return (
            <div key={i} className="flex items-start gap-3 py-2.5">
              <div
                className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ background: n.iconBg }}
              >
                <Icon size={15} style={{ stroke: n.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-surface-900 dark:text-surface-100 mb-0.5">{n.title}</div>
                <div className="text-[11.5px] text-surface-400">{n.time}</div>
              </div>
              {n.unread && (
                <div className="w-[7px] h-[7px] rounded-full bg-red-500 flex-shrink-0 mt-1.5 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
