/**
 * StudentNotifications — list of recent notifications from the API.
 */
import { useEffect, useState } from 'react';
import { Bell, CreditCard, Calendar, FileText, Award } from 'lucide-react';
import api from '../../../core/api/axios';
import { API_ENDPOINTS } from '../../../core/api/endpoints';

const ICON_MAP = {
  system: Bell,
  payment: CreditCard,
  academic: Calendar,
  grade: FileText,
  attendance: Award,
};

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { params: { limit: 10 } })
      .then(res => {
        const data = res.data.data;
        setNotifications(data?.notifications || []);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const hasUnread = notifications.some((n) => !n.isRead);

  if (loading) {
    return (
      <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
            <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
            Notifications
          </div>
        </div>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="flex items-start gap-3 py-2 animate-pulse">
              <div className="w-[34px] h-[34px] rounded-[10px] bg-surface-100 dark:bg-surface-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-3/4 bg-surface-100 dark:bg-surface-700 rounded" />
                <div className="h-3 w-1/3 bg-surface-50 dark:bg-surface-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Bell size={24} className="text-surface-200 dark:text-surface-600 mb-2" />
          <p className="text-sm text-surface-400">No notifications yet</p>
        </div>
      ) : (
        <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
          {notifications.map((n) => {
            const Icon = ICON_MAP[n.type] || Bell;
            const timeAgo = n.createdAt
              ? new Date(n.createdAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })
              : '';
            return (
              <div key={n.id} className="flex items-start gap-3 py-2.5">
                <div
                  className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{
                    background: n.isRead ? 'var(--surface-50)' : 'rgba(8,80,65,.08)',
                  }}
                >
                  <Icon size={15} style={{ stroke: n.isRead ? '#9BA59C' : '#085041' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-surface-900 dark:text-surface-100 mb-0.5">
                    {n.message}
                  </div>
                  <div className="text-[11.5px] text-surface-400">{timeAgo}</div>
                </div>
                {!n.isRead && (
                  <div className="w-[7px] h-[7px] rounded-full bg-red-500 flex-shrink-0 mt-1.5 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
