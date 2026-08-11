/**
 * CampusMessagesPage — Admin management of parent ↔ campus message threads.
 *
 * Features:
 *  - Lists all messages with status + student filters
 *  - Opens a thread, replies as campus, updates status
 *
 * Route: /dashboard/campus-messages
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useTheme } from "../../../core/hooks/useTheme";
import {
  getCampusMessages,
  getCampusMessageThread,
  replyToCampusMessage,
  updateCampusMessageStatus,
} from "../../../core/api/messageService";
import {
  FiMail,
  FiSend,
  FiChevronLeft,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";

const STATUS_STYLE = {
  open: { labelKey: "parent.messages.open", cls: "bg-blue-50 text-blue-700", dot: "bg-blue-500" },
  in_progress: { labelKey: "parent.messages.inProgress", cls: "bg-amber-50 text-amber-700", dot: "bg-amber-400" },
  resolved: { labelKey: "parent.messages.resolved", cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
};

function formatDate(dateStr, locale) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default function CampusMessagesPage() {
  const { t, i18n } = useTranslation("common");
  const { primaryColor } = useTheme();
  const pc = primaryColor || "#085041";
  const isFr = i18n.language === "fr";

  const [messages, setMessages] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 12;

  const [thread, setThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: PER_PAGE, offset: page * PER_PAGE };
      if (statusFilter) params.status = statusFilter;
      const data = await getCampusMessages(params);
      setMessages(data.messages || []);
      setTotal(data.total || 0);
    } catch {
      setMessages([]);
      setTotal(0);
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openThread = async (id) => {
    setThreadLoading(true);
    setThread(null);
    setReply("");
    try {
      const data = await getCampusMessageThread(id);
      setThread(data);
    } catch {
      toast.error(isFr ? "Impossible de charger la conversation" : "Failed to load conversation");
    }
    setThreadLoading(false);
  };

  const handleReply = async () => {
    if (!thread) return;
    if (!reply.trim()) {
      toast.error(isFr ? "Veuillez écrire un message" : "Please write a message");
      return;
    }
    setReplying(true);
    try {
      await replyToCampusMessage(thread.id, { message: reply.trim() });
      setReply("");
      openThread(thread.id);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || (isFr ? "Échec de l'envoi" : "Failed to send"));
    } finally {
      setReplying(false);
    }
  };

  const handleStatus = async (status) => {
    if (!thread) return;
    setUpdatingStatus(true);
    try {
      const updated = await updateCampusMessageStatus(thread.id, status);
      setThread((prev) => ({ ...prev, status: updated.status }));
      load();
      toast.success(isFr ? "Statut mis à jour" : "Status updated");
    } catch {
      toast.error(isFr ? "Échec de la mise à jour" : "Failed to update");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filtered = messages.filter(
    (m) =>
      !search ||
      m.subject?.toLowerCase().includes(search.toLowerCase()) ||
      m.senderName?.toLowerCase().includes(search.toLowerCase()) ||
      m.studentName?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}>
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
            <FiMail className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight">
              {t("parent.messages.campusTitle", "Campus Messages")}
            </h1>
            <p className="text-white/70 text-sm">
              {t("parent.messages.campusSubtitle", "Respond to parents' messages")}
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isFr ? "Rechercher..." : "Search..."}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-sm outline-none"
          >
            <option value="">{isFr ? "Tous les statuts" : "All status"}</option>
            {Object.keys(STATUS_STYLE).map((s) => (
              <option key={s} value={s}>{t(STATUS_STYLE[s].labelKey)}</option>
            ))}
          </select>
          <button onClick={load} className="w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-900 flex items-center justify-center cursor-pointer">
            <FiRefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* Message list */}
        <div className="lg:col-span-2 bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 overflow-hidden self-start">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FiRefreshCw className="w-6 h-6 animate-spin" style={{ color: pc }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">
              {isFr ? "Aucun message" : "No messages"}
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-50 dark:divide-surface-700/50 max-h-[70vh] overflow-y-auto">
                {filtered.map((m) => {
                  const st = STATUS_STYLE[m.status] || STATUS_STYLE.open;
                  return (
                    <button
                      key={m.id}
                      onClick={() => openThread(m.id)}
                      className={`w-full text-left px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-surface-900/30 transition-colors cursor-pointer ${
                        thread?.id === m.id ? "bg-gray-50 dark:bg-surface-900/40" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[13px] font-bold text-gray-800 dark:text-surface-200 truncate">{m.subject}</div>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${st.cls}`}>
                          <span className={`w-1 h-1 rounded-full ${st.dot}`} />
                          {t(st.labelKey)}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 truncate mt-1">
                        {m.senderName || m.userEmail || "—"}
                        {m.studentName ? ` · ${m.studentName}` : ""}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{formatDate(m.createdAt, isFr)}</div>
                    </button>
                  );
                })}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-surface-700">
                  <span className="text-[11px] text-gray-400">{total} total</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                    >
                      {isFr ? "Préc" : "Prev"}
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                    >
                      {isFr ? "Suiv" : "Next"}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Thread */}
        <div className="lg:col-span-3 bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 overflow-hidden flex flex-col">
          {threadLoading ? (
            <div className="flex items-center justify-center py-20">
              <FiRefreshCw className="w-6 h-6 animate-spin" style={{ color: pc }} />
            </div>
          ) : !thread ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-sm text-gray-400">
              <FiMail className="w-10 h-10 text-gray-200 dark:text-surface-600 mb-3" />
              {isFr ? "Sélectionnez un message pour voir la conversation." : "Select a message to view the conversation."}
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-surface-700">
                <button onClick={() => setThread(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-900 flex items-center justify-center cursor-pointer text-gray-400">
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold text-gray-900 dark:text-surface-100 truncate">{thread.subject}</div>
                  <div className="text-[11px] text-gray-400 truncate">
                    {thread.senderName || thread.userEmail || "—"}
                    {thread.studentName ? ` · ${thread.studentName}` : ""} · {formatDate(thread.createdAt, isFr)}
                  </div>
                </div>
                <select
                  value={thread.status}
                  disabled={updatingStatus}
                  onChange={(e) => handleStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-[11px] font-semibold outline-none cursor-pointer disabled:opacity-50"
                >
                  {Object.keys(STATUS_STYLE).map((s) => (
                    <option key={s} value={s}>{t(STATUS_STYLE[s].labelKey)}</option>
                  ))}
                </select>
              </div>

              {/* Thread body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[55vh]">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-50 text-indigo-600 text-xs font-bold">
                    {(thread.senderName || "P")[0].toUpperCase()}
                  </div>
                  <div className="bg-gray-50 dark:bg-surface-900/40 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                    <div className="text-[11px] text-gray-400 mb-1">
                      {thread.senderName || thread.userEmail || t("parent.messages.parent", "Parent")}
                    </div>
                    <p className="text-[13px] text-gray-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{thread.message}</p>
                  </div>
                </div>

                {(thread.replies || []).map((r) => {
                  const isAdmin = r.isAdmin;
                  return isAdmin ? (
                    <div key={r.id} className="flex items-start gap-3 flex-row-reverse">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: `${pc}12`, color: pc }}>
                        {t("parent.messages.campus", "Campus")}
                      </div>
                      <div className="bg-gray-50 dark:bg-surface-900/40 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                        <div className="text-[11px] text-gray-400 mb-1">
                          {t("parent.messages.campus", "Campus")} · {formatDate(r.createdAt, isFr)}
                        </div>
                        <p className="text-[13px] text-gray-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{r.message}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={r.id} className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-50 text-indigo-600 text-xs font-bold">
                        {(r.senderName || "P")[0].toUpperCase()}
                      </div>
                      <div className="bg-gray-50 dark:bg-surface-900/40 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                        <div className="text-[11px] text-gray-400 mb-1">
                          {r.senderName || t("parent.messages.parent", "Parent")} · {formatDate(r.createdAt, isFr)}
                        </div>
                        <p className="text-[13px] text-gray-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{r.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply box */}
              <div className="p-4 border-t border-gray-100 dark:border-surface-700">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={2}
                  placeholder={isFr ? "Répondre au parent..." : "Reply to the parent..."}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleReply}
                    disabled={replying}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-white text-[12px] font-bold cursor-pointer transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: pc }}
                  >
                    {replying ? <FiRefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FiSend className="w-3.5 h-3.5" />}
                    {t("parent.messages.sendReply", "Send reply")}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
