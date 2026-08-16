/**
 * TeacherNotifications — widget « Notifications » du dashboard enseignant.
 *
 * Données réelles : /api/notifications (dernières notifications de
 * l'utilisateur connecté). Plus de liste de démonstration codée en dur.
 * Un clic sur une notification non lue la marque comme lue.
 */
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiBell as Bell,
  FiEdit3,
  FiCalendar,
  FiDollarSign,
  FiAlertTriangle,
  FiSpeaker,
  FiInbox,
} from "react-icons/fi";
import {
  getNotifications,
  markNotificationRead,
} from "../../../core/api/notificationService";

const ICON_MAP = {
  grade: FiEdit3,
  attendance: FiCalendar,
  payment: FiDollarSign,
  discipline: FiAlertTriangle,
  system: Bell,
  announcement: FiSpeaker,
};

function timeAgo(iso, isFr) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return isFr ? "à l'instant" : "just now";
  if (min < 60) return isFr ? `il y a ${min} min` : `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return isFr ? `il y a ${h} h` : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return isFr ? `il y a ${d} j` : `${d}d ago`;
  return new Date(iso).toLocaleDateString(isFr ? "fr" : "en", {
    day: "numeric",
    month: "short",
  });
}

export default function TeacherNotifications() {
  const { t, i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => getNotifications({ limit: 5 }),
    staleTime: 30 * 1000,
  });
  const notifications = listQuery.data?.notifications || [];
  const hasUnread = notifications.some((n) => !n.isRead);

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm flex-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          {t("teacher.notifications.title")}
        </div>
        {hasUnread && (
          <span className="w-[7px] h-[7px] rounded-full bg-red-500 animate-pulse" />
        )}
      </div>

      {listQuery.isFetching && notifications.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[10px] bg-surface-100 dark:bg-surface-700/60 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-1.5 pt-1">
                <div className="h-3 rounded bg-surface-100 dark:bg-surface-700/60 animate-pulse w-3/4" />
                <div className="h-2.5 rounded bg-surface-100 dark:bg-surface-700/60 animate-pulse w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center">
          <FiInbox className="w-7 h-7 text-surface-300 dark:text-surface-600 mb-2" />
          <p className="text-[12.5px] text-surface-400">
            {t("notifications.empty", "Aucune notification")}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
          {notifications.map((n) => {
            const Icon = ICON_MAP[n.type] || Bell;
            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className={`flex items-start gap-3 py-3 ${
                  n.isRead ? "" : "cursor-pointer"
                }`}
              >
                <div
                  className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(8,80,65,.08)" }}
                >
                  <Icon size={16} style={{ stroke: "#085041" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[13px] mb-0.5 leading-snug ${
                      n.isRead
                        ? "font-medium text-surface-600 dark:text-surface-300"
                        : "font-semibold text-surface-900 dark:text-surface-100"
                    }`}
                  >
                    {n.message}
                  </div>
                  <div className="text-[11.5px] text-surface-400">
                    {timeAgo(n.createdAt, isFr)}
                  </div>
                </div>
                {!n.isRead && (
                  <span className="w-[7px] h-[7px] rounded-full bg-teal-600 flex-shrink-0 mt-1.5 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
