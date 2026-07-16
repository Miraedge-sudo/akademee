import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSend,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiBell,
  FiAlertCircle,
  FiInfo,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiCheck,
  FiClock,
} from "react-icons/fi";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  unpublishAnnouncement,
} from "../../../core/api/announcementService";

const AUDIENCE_KEYS = ["everyone", "teachers", "students", "parents"];

const PRIORITY_OPTIONS = [
  { value: "low", key: "low", color: "#22c55e" },
  { value: "normal", key: "normal", color: "#3b82f6" },
  { value: "high", key: "high", color: "#ef4444" },
];

const PRIORITY_CONFIG = {
  high: { bg: "#fee2e2", text: "#991b1b", icon: FiAlertCircle },
  normal: { bg: "#eff6ff", text: "#1e40af", icon: FiBell },
  low: { bg: "#f0fdf4", text: "#166534", icon: FiInfo },
};

const INITIAL_FORM = {
  title: "",
  content: "",
  targetAudience: "all",
  priority: "normal",
  isPublished: false,
};

function FormModal({ isOpen, onClose, onSubmit, initialData, loading, t }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || "",
        content: initialData.content || "",
        targetAudience: initialData.targetAudience || "all",
        priority: initialData.priority || "normal",
        isPublished: initialData.isPublished || false,
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error(t("announcements.titleRequired"));
    if (!form.content.trim()) return toast.error(t("announcements.contentRequired"));
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              {isEditing ? <FiEdit2 className="w-5 h-5 text-teal-700" /> : <FiPlus className="w-5 h-5 text-teal-700" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isEditing ? t("announcements.editModalTitle") : t("announcements.newModalTitle")}
              </h2>
              <p className="text-sm text-gray-500">
                {isEditing ? t("announcements.editModalDesc") : t("announcements.newModalDesc")}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer transition-colors"
          >
            <FiXCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("announcements.titleField")}</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm"
              placeholder={t("announcements.titlePlaceholder")}
              maxLength={255}
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("announcements.contentField")}</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={6}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm resize-y"
              placeholder={t("announcements.contentPlaceholder")}
            />
          </div>

          {/* Options row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("announcements.targetAudience")}</label>
              <div className="flex flex-wrap gap-2">
                {AUDIENCE_KEYS.map((key) => {
                  const value = key === "everyone" ? "all" : key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, targetAudience: value }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        form.targetAudience === value
                          ? "bg-teal-50 border-teal-300 text-teal-700"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {t(`announcements.${key}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t("announcements.priority")}</label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((opt) => {
                  const isActive = form.priority === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, priority: opt.value }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                        isActive
                          ? "border-2 shadow-sm"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                      style={isActive ? { borderColor: opt.color, color: opt.color, background: `${opt.color}10` } : {}}
                    >
                      {t(`announcements.${opt.key}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Publish toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm((f) => ({ ...f, isPublished: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-teal-600 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:after:translate-x-4" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-700">{t("announcements.publishImmediately")}</span>
              <p className="text-xs text-gray-400">{t("announcements.publishHint")}</p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
            >
              {t("announcements.cancelBtn")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              {loading ? (
                <FiRefreshCw className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                <FiEdit2 className="w-4 h-4" />
              ) : (
                <FiPlus className="w-4 h-4" />
              )}
              {isEditing ? t("announcements.updateBtn") : t("announcements.createBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ isOpen, onClose, onConfirm, loading, title, t }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <FiTrash2 className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{t("announcements.deleteModalTitle")}</h3>
          <p className="text-sm text-gray-500 mb-1">
            {t("announcements.deleteModalDesc")}
          </p>
          <p className="text-sm font-medium text-gray-700 mb-6">&ldquo;{title}&rdquo;</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
            >
              {t("announcements.cancelBtn")}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              {loading ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiTrash2 className="w-4 h-4" />}
              {t("announcements.deleteBtn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsAdminPage() {
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [filterAudience, setFilterAudience] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const PER_PAGE = 20;

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: PER_PAGE, offset: page * PER_PAGE };
      if (filterAudience) params.targetAudience = filterAudience;
      if (filterStatus) params.isPublished = filterStatus === "published";
      const data = await getAnnouncements(params);
      setAnnouncements(data.announcements || []);
      setTotal(data.total || 0);
    } catch {
      toast.error(t("announcements.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, filterAudience, filterStatus, t]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreate = async (data) => {
    setSubmitting(true);
    try {
      await createAnnouncement(data);
      toast.success(t("announcements.created"));
      setShowForm(false);
      fetchAnnouncements();
    } catch {
      toast.error(t("announcements.createError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (data) => {
    if (!editItem) return;
    setSubmitting(true);
    try {
      await updateAnnouncement(editItem.id, data);
      toast.success(t("announcements.updated"));
      setEditItem(null);
      setShowForm(false);
      fetchAnnouncements();
    } catch {
      toast.error(t("announcements.updateError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSubmitting(true);
    try {
      await deleteAnnouncement(deleteItem.id);
      toast.success(t("announcements.deleted"));
      setDeleteItem(null);
      fetchAnnouncements();
    } catch {
      toast.error(t("announcements.deleteError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublishToggle = async (ann) => {
    try {
      if (ann.isPublished) {
        await unpublishAnnouncement(ann.id);
        toast.success(t("announcements.unpublished"));
      } else {
        await publishAnnouncement(ann.id);
        toast.success(t("announcements.published"));
      }
      fetchAnnouncements();
    } catch {
      toast.error(t("announcements.publishError"));
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString(i18n.language === "fr" ? "fr-FR" : "en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const filtered = announcements.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <FiChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <FiBell className="w-5 h-5 text-teal-700" />
                  <h1 className="text-xl font-bold text-gray-900">{t("announcements.title")}</h1>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{t("announcements.subtitle")}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditItem(null);
                setShowForm(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-all cursor-pointer shadow-sm"
            >
              <FiPlus className="w-4 h-4" />
              {t("announcements.newBtn")}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("announcements.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="w-4 h-4 text-gray-400" />
              <select
                value={filterAudience}
                onChange={(e) => { setFilterAudience(e.target.value); setPage(0); }}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal-500"
              >
                <option value="">{t("announcements.allAudiences")}</option>
                {AUDIENCE_KEYS.map((key) => {
                  const value = key === "everyone" ? "all" : key;
                  return (
                    <option key={key} value={value}>{t(`announcements.${key}`)}</option>
                  );
                })}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal-500"
              >
                <option value="">{t("announcements.allStatus")}</option>
                <option value="published">{t("announcements.publishedStatus")}</option>
                <option value="draft">{t("announcements.draftStatus")}</option>
              </select>
            </div>
            <button
              onClick={fetchAnnouncements}
              className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <FiRefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FiRefreshCw className="w-6 h-6 text-teal-700 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <FiBell className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{t("announcements.noAnnouncements")}</h3>
              <p className="text-sm text-gray-500 mb-6">{t("announcements.noAnnouncementsDesc")}</p>
              <button
                onClick={() => {
                  setEditItem(null);
                  setShowForm(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition-all cursor-pointer"
              >
                <FiPlus className="w-4 h-4" />
                {t("announcements.createFirst")}
              </button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {/* Header row */}
                <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <div className="flex-1 min-w-0">{t("announcements.tableTitle")}</div>
                  <div className="w-24 text-center">{t("announcements.tablePriority")}</div>
                  <div className="w-28 text-center">{t("announcements.tableAudience")}</div>
                  <div className="w-28 text-center">{t("announcements.tableStatus")}</div>
                  <div className="w-36 text-center">{t("announcements.tableDate")}</div>
                  <div className="w-28 text-right">{t("announcements.tableActions")}</div>
                </div>

                {filtered.map((ann) => {
                  const pConfig = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.normal;
                  const Icon = pConfig.icon;
                  return (
                    <div key={ann.id} className="flex flex-col md:flex-row md:items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{ann.title}</h4>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{ann.content}</p>
                      </div>

                      <div className="flex md:hidden items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: pConfig.bg, color: pConfig.text }}>
                          <Icon className="w-2.5 h-2.5" />
                          {ann.priority}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {ann.targetAudience}
                        </span>
                        {ann.isPublished ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700">{t("announcements.publishedStatus")}</span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">{t("announcements.draftStatus")}</span>
                        )}
                      </div>

                      <div className="hidden md:flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full" style={{ background: pConfig.bg, color: pConfig.text }}>
                          <Icon className="w-3 h-3" />
                          {ann.priority}
                        </span>
                      </div>

                      <div className="hidden md:block w-28 text-center">
                        <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                          {ann.targetAudience}
                        </span>
                      </div>

                      <div className="hidden md:block w-28 text-center">
                        {ann.isPublished ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                            <FiCheck className="w-3 h-3" />
                            {t("announcements.publishedStatus")}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                            <FiClock className="w-3 h-3" />
                            {t("announcements.draftStatus")}
                          </span>
                        )}
                      </div>

                      <div className="hidden md:block w-36 text-center">
                        <span className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
                          <FiCalendar className="w-3 h-3" />
                          {formatDate(ann.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 md:justify-end md:w-28">
                        <button
                          onClick={() => handlePublishToggle(ann)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                            ann.isPublished
                              ? "hover:bg-amber-50 text-amber-600"
                              : "hover:bg-green-50 text-green-600"
                          }`}
                          title={ann.isPublished ? t("announcements.unpublishTitle") : t("announcements.publishTitle")}
                        >
                          <FiSend className={`w-4 h-4 ${ann.isPublished ? "opacity-50" : ""}`} />
                        </button>
                        <button
                          onClick={() => {
                            setEditItem(ann);
                            setShowForm(true);
                          }}
                          className="w-9 h-9 rounded-lg hover:bg-teal-50 text-teal-600 flex items-center justify-center transition-colors cursor-pointer"
                          title={t("announcements.editBtn")}
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteItem(ann)}
                          className="w-9 h-9 rounded-lg hover:bg-red-50 text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                          title={t("announcements.deleteBtn")}
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    {t("announcements.showing", { from: page * PER_PAGE + 1, to: Math.min((page + 1) * PER_PAGE, total), total })}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="w-9 h-9 rounded-lg hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const start = Math.max(0, Math.min(page - 2, totalPages - 5));
                      const p = start + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                            p === page
                              ? "bg-teal-700 text-white"
                              : "hover:bg-gray-100 text-gray-600"
                          }`}
                        >
                          {p + 1}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="w-9 h-9 rounded-lg hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                    >
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <FormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        onSubmit={editItem ? handleUpdate : handleCreate}
        initialData={editItem}
        loading={submitting}
        t={t}
      />
      <DeleteModal
        isOpen={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        loading={submitting}
        title={deleteItem?.title || ""}
        t={t}
      />
    </div>
  );
}
