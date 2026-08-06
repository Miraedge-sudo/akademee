/**
 * ContactCampusPage — Parent ↔ campus messaging.
 *
 * Features:
 *  - Lists all messages the parent sent to the campus
 *  - Opens a thread with replies
 *  - Lets the parent reply to a thread
 *  - Compose a new message (subject, message, optional child)
 *
 * Route: /dashboard/contact-campus
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useTheme } from "../../../core/hooks/useTheme";
import {
  getMyMessages,
  getMyMessageThread,
  sendCampusMessage,
  replyToMessage,
  getMyChildren,
} from "../../../core/api/parentService";
import {
  FiMail,
  FiSend,
  FiMessageSquare,
  FiPlus,
  FiChevronLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
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

export default function ContactCampusPage() {
  const { t, i18n } = useTranslation("common");
  const { primaryColor } = useTheme();
  const pc = primaryColor || "#085041";
  const isFr = i18n.language === "fr";

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [children, setChildren] = useState([]);

  // compose form
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [studentId, setStudentId] = useState("");
  const [sending, setSending] = useState(false);

  // thread view
  const [thread, setThread] = useState(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [msgs, childs] = await Promise.all([
        getMyMessages().catch(() => []),
        getMyChildren().catch(() => []),
      ]);
      setMessages(Array.isArray(msgs) ? msgs : []);
      setChildren(Array.isArray(childs) ? childs : []);
    } catch {
      setMessages([]);
      setChildren([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openThread = async (id) => {
    setThreadLoading(true);
    setThread(null);
    setReply("");
    try {
      const data = await getMyMessageThread(id);
      setThread(data);
    } catch {
      toast.error(isFr ? "Impossible de charger la conversation" : "Failed to load conversation");
    }
    setThreadLoading(false);
  };

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error(isFr ? "Le sujet et le message sont requis" : "Subject and message are required");
      return;
    }
    setSending(true);
    try {
      await sendCampusMessage({ subject: subject.trim(), message: message.trim(), studentId: studentId || null });
      toast.success(isFr ? "Message envoyé" : "Message sent");
      setComposeOpen(false);
      setSubject("");
      setMessage("");
      setStudentId("");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || (isFr ? "Échec de l'envoi" : "Failed to send"));
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!thread) return;
    if (!reply.trim()) {
      toast.error(isFr ? "Veuillez écrire un message" : "Please write a message");
      return;
    }
    setReplying(true);
    try {
      await replyToMessage(thread.id, { message: reply.trim() });
      setReply("");
      openThread(thread.id);
    } catch (err) {
      toast.error(err?.response?.data?.message || (isFr ? "Échec de l'envoi" : "Failed to send"));
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}>
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
              <FiMail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight">
                {t("parent.messages.title", "Contact Campus")}
              </h1>
              <p className="text-white/70 text-sm">
                {t("parent.messages.subtitle", "Ask the school anything")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setComposeOpen(true)}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl text-[13px] font-bold text-white bg-white/15 hover:bg-white/25 transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            {t("parent.messages.newMessage", "New message")}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FiRefreshCw className="w-6 h-6 animate-spin" style={{ color: pc }} />
        </div>
      ) : messages.length === 0 && !thread ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-surface-800 rounded-2xl border border-gray-200 dark:border-surface-700">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-surface-700 flex items-center justify-center mb-4 border-2 border-dashed border-gray-200 dark:border-surface-600">
            <FiMessageSquare className="w-8 h-8 text-gray-300 dark:text-surface-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-surface-200">
            {t("parent.messages.empty", "No messages yet")}
          </h3>
          <p className="text-sm text-gray-400 max-w-sm mt-1">
            {t("parent.messages.emptyDesc", "Send a message to the campus to get started.")}
          </p>
          <button
            onClick={() => setComposeOpen(true)}
            className="mt-4 flex items-center gap-1.5 h-10 px-5 rounded-xl text-white text-[13px] font-bold cursor-pointer transition-all hover:opacity-90"
            style={{ background: pc }}
          >
            <FiPlus className="w-4 h-4" />
            {t("parent.messages.newMessage", "New message")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Message list */}
          <div className="lg:col-span-2 bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 overflow-hidden self-start max-h-[70vh] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">{t("parent.messages.empty")}</div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-surface-700/50">
                {messages.map((m) => {
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
                        {m.studentName || t("parent.messages.general", "General")} · {formatDate(m.createdAt, isFr)}
                      </div>
                      {m.replyCount > 0 && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          {m.replyCount} {t("parent.messages.replies", "replies")}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
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
                {t("parent.messages.selectHint", "Select a message to view the conversation.")}
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
                    <div className="text-[11px] text-gray-400">
                      {thread.studentName || t("parent.messages.general", "General")} · {formatDate(thread.createdAt, isFr)}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full ${(STATUS_STYLE[thread.status] || STATUS_STYLE.open).cls}`}>
                    {t((STATUS_STYLE[thread.status] || STATUS_STYLE.open).labelKey)}
                  </span>
                </div>

                {/* Thread body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[50vh]">
                  {/* Original message */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-50 text-indigo-600 text-xs font-bold">
                      {t("parent.messages.you", "You")}
                    </div>
                    <div className="bg-gray-50 dark:bg-surface-900/40 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                      <div className="text-[11px] text-gray-400 mb-1">{t("parent.messages.you", "You")}</div>
                      <p className="text-[13px] text-gray-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{thread.message}</p>
                    </div>
                  </div>

                  {/* Replies */}
                  {(thread.replies || []).map((r) => {
                    const isAdmin = r.isAdmin;
                    return isAdmin ? (
                      <div key={r.id} className="flex items-start gap-3 flex-row-reverse">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ background: `${pc}12`, color: pc }}>
                          {t("parent.messages.campus", "Campus")}
                        </div>
                        <div className="bg-gray-50 dark:bg-surface-900/40 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                          <div className="text-[11px] text-gray-400 mb-1" style={{ color: pc }}>
                            {t("parent.messages.campus", "Campus")} · {formatDate(r.createdAt, isFr)}
                          </div>
                          <p className="text-[13px] text-gray-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{r.message}</p>
                        </div>
                      </div>
                    ) : (
                      <div key={r.id} className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-50 text-indigo-600 text-xs font-bold">
                          {t("parent.messages.you", "You")}
                        </div>
                        <div className="bg-gray-50 dark:bg-surface-900/40 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                          <div className="text-[11px] text-gray-400 mb-1">{t("parent.messages.you", "You")}</div>
                          <p className="text-[13px] text-gray-700 dark:text-surface-300 leading-relaxed whitespace-pre-wrap">{r.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reply box */}
                {thread.status !== "resolved" ? (
                  <div className="p-4 border-t border-gray-100 dark:border-surface-700">
                    <textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      rows={2}
                      placeholder={t("parent.messages.replyPlaceholder", "Write a reply...")}
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
                ) : (
                  <div className="p-4 border-t border-gray-100 dark:border-surface-700 flex items-center justify-center gap-2 text-[12px] text-emerald-600">
                    <FiCheckCircle className="w-4 h-4" />
                    {t("parent.messages.resolvedNote", "This conversation is resolved.")}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Compose modal ── */}
      {composeOpen && (
        <div className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setComposeOpen(false)}>
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-surface-700 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                  {t("parent.messages.newMessage", "New message")}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{t("parent.messages.newMessageDesc", "Your message goes straight to the campus team.")}</p>
              </div>
              <button onClick={() => setComposeOpen(false)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-900 flex items-center justify-center cursor-pointer">
                <FiAlertCircle className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-surface-300 mb-1.5">
                  {t("parent.messages.concernsChild", "Related to (optional)")}
                </label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">{t("parent.messages.general", "General")}</option>
                  {children.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-surface-300 mb-1.5">
                  {t("parent.messages.subject", "Subject")} *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={isFr ? "Ex: Question sur les frais" : "e.g. Question about fees"}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-surface-300 mb-1.5">
                  {t("parent.messages.message", "Message")} *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder={isFr ? "Écrivez votre message..." : "Write your message..."}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-4 border-t border-gray-100 dark:border-surface-700">
              <button onClick={() => setComposeOpen(false)} className="h-10 px-5 rounded-lg border border-gray-200 dark:border-surface-600 text-sm font-medium text-gray-600 dark:text-surface-400 hover:bg-gray-50 transition-colors cursor-pointer">
                {t("actions.cancel")}
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="h-10 px-6 rounded-xl text-white text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                style={{ background: pc }}
              >
                {sending ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
                {sending ? (isFr ? "Envoi..." : "Sending...") : t("parent.messages.send", "Send")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
