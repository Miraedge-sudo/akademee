/**
 * NotificationBell — cloche de la navbar avec badge de non-lus et panneau
 * déroulant des notifications (lister, marquer lu, supprimer).
 *
 * Données : /api/notifications (+ /unread/count pour le badge).
 * Le compteur est rafraîchi toutes les 60 s et à chaque ouverture.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FiBell,
  FiEdit3,
  FiCalendar,
  FiDollarSign,
  FiAlertTriangle,
  FiSpeaker,
  FiTrash2,
  FiInbox,
} from "react-icons/fi";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  deleteNotification,
} from "../core/api/notificationService";

// Icône + couleur par type de notification (enum backend)
const TYPE_META = {
  grade: { icon: FiEdit3, bg: "rgba(8,80,65,.08)", color: "#085041" },
  attendance: { icon: FiCalendar, bg: "rgba(245,158,11,.09)", color: "#D97706" },
  payment: { icon: FiDollarSign, bg: "rgba(16,185,129,.09)", color: "#059669" },
  discipline: { icon: FiAlertTriangle, bg: "rgba(239,68,68,.09)", color: "#DC2626" },
  system: { icon: FiBell, bg: "rgba(59,130,246,.09)", color: "#2563EB" },
  announcement: { icon: FiSpeaker, bg: "rgba(139,92,246,.09)", color: "#7C3AED" },
};

const DEFAULT_META = { icon: FiBell, bg: "rgba(120,130,125,.08)", color: "#5C665E" };

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

export default function NotificationBell() {
  const { t, i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Badge : non-lus, rafraîchi toutes les 60 s
  const unreadQuery = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => getUnreadCount(),
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });
  const unread = unreadQuery.data?.count || 0;

  // Liste chargée à l'ouverture du panneau
  const listQuery = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: () => getNotifications({ limit: 15 }),
    enabled: open,
    staleTime: 15 * 1000,
  });
  const notifications = listQuery.data?.notifications || [];

  // Fermeture au clic extérieur
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // À l'ouverture, re-synchronise le badge
  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={toggle}
        aria-label={t("navbar.notifications", "Notifications")}
        className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md text-surface-500 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors shrink-0"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px]"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white dark:border-surface-800">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-[340px] sm:w-[380px] bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-600 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* En-tête */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-700">
            <span className="text-[13px] font-bold text-surface-900 dark:text-surface-100">
              {t("navbar.notifications", "Notifications")}
            </span>
            {unread > 0 && (
              <span className="text-[10.5px] font-semibold text-surface-400">
                {unread} {t("navbar.unread", "non lue(s)")}
              </span>
            )}
          </div>

          {/* Liste */}
          <div className="max-h-[380px] overflow-y-auto">
            {listQuery.isFetching && notifications.length === 0 ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-[10px] bg-surface-100 dark:bg-surface-700/60 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 rounded bg-surface-100 dark:bg-surface-700/60 animate-pulse w-3/4" />
                      <div className="h-2.5 rounded bg-surface-100 dark:bg-surface-700/60 animate-pulse w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-10 px-4 text-center">
                <FiInbox className="w-7 h-7 text-surface-300 dark:text-surface-600 mb-2" />
                <p className="text-[12.5px] text-surface-400">
                  {t("notifications.empty", "Aucune notification")}
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = TYPE_META[n.type] || DEFAULT_META;
                const Icon = meta.icon;
                return (
                  <div
                    key={n.id}
                    className={`group flex items-start gap-3 px-4 py-3 border-b border-surface-50 dark:border-surface-700/50 cursor-pointer transition-colors ${
                      n.isRead ? "" : "bg-primary-50/40 dark:bg-primary-900/10"
                    } hover:bg-surface-50 dark:hover:bg-surface-700/40`}
                    onClick={() => !n.isRead && handleMarkRead(n.id)}
                  >
                    <div
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0"
                      style={{ background: meta.bg }}
                    >
                      <Icon size={16} style={{ stroke: meta.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[12.5px] leading-snug ${
                          n.isRead
                            ? "text-surface-600 dark:text-surface-300"
                            : "font-semibold text-surface-900 dark:text-surface-100"
                        }`}
                      >
                        {n.message}
                      </p>
                      <p className="text-[10.5px] text-surface-400 mt-0.5">
                        {timeAgo(n.createdAt, isFr)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600 flex-shrink-0 mt-1.5" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(n.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md flex items-center justify-center text-surface-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                      title={t("notifications.delete", "Supprimer")}
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
