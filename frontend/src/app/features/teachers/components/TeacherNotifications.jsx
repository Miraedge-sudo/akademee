/**
 * TeacherNotifications — notification list with icon, title, time and unread pulse dot.
 */
import { Bell, UserCheck, Calendar } from 'lucide-react';

const ICON_MAP = { bell: Bell, 'user-check': UserCheck, calendar: Calendar };

const SAMPLE_NOTIFS = [
  { icon: 'bell',       title: 'Report cards due January 28',   time: '2 hours ago', iconBg: 'rgba(8,80,65,.08)',    iconColor: '#085041', unread: true  },
  { icon: 'user-check', title: 'New student added to Form 4A',  time: 'Yesterday',   iconBg: 'rgba(59,130,246,.09)', iconColor: '#3B82F6', unread: false },
  { icon: 'calendar',   title: 'Academic calendar updated',      time: '3 days ago',  iconBg: 'rgba(245,158,11,.09)',iconColor: '#F59E0B', unread: false },
];

export default function TeacherNotifications({ notifications = SAMPLE_NOTIFS }) {
  const hasUnread = notifications.some((n) => n.unread);

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm flex-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Notifications
        </div>
        {hasUnread && (
          <span className="w-[7px] h-[7px] rounded-full bg-red-500 animate-pulse" />
        )}
      </div>

      <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
        {notifications.map((n, i) => {
          const Icon = ICON_MAP[n.icon] || Bell;
          return (
            <div key={i} className="flex items-start gap-3 py-3">
              <div
                className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                style={{ background: n.iconBg }}
              >
                <Icon size={16} style={{ stroke: n.iconColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-surface-900 dark:text-surface-100 mb-0.5">{n.title}</div>
                <div className="text-[11.5px] text-surface-400">{n.time}</div>
              </div>
              {n.unread && (
                <span className="w-[7px] h-[7px] rounded-full bg-teal-600 flex-shrink-0 mt-1.5 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
