import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FiUsers,
  FiClipboard,
  FiBarChart2,
  FiMail,
  FiPhone,
  FiCalendar,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiRefreshCw,
  FiMessageSquare,
  FiUser,
  FiUserPlus,
  FiX,
  FiCheck,
} from "react-icons/fi";
import {
  getEnrolmentInquiries,
  updateInquiryStatus,
} from "../../../core/api/enrolmentService";
import { createStudent } from "../../../core/api/studentService";
import { getClasses } from "../../../core/api/classService";

const STATUS_CONFIG = {
  new: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    labelKey: "admissions.statusNew",
  },
  contacted: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
    labelKey: "admissions.statusContacted",
  },
  enrolled: {
    bg: "bg-green-50",
    text: "text-green-700",
    dot: "bg-green-500",
    labelKey: "admissions.statusEnrolled",
  },
  closed: {
    bg: "bg-gray-50",
    text: "text-gray-600",
    dot: "bg-gray-400",
    labelKey: "admissions.statusClosed",
  },
};

const STATUS_OPTIONS = ["new", "contacted", "enrolled", "closed"];

const ADMISSIONS_META = {
  applications: {
    icon: <FiClipboard className="w-6 h-6" />,
    titleKey: "admissions.inquiries",
    description: "Manage admission applications",
    descriptionFr: "Gérer les demandes d'admission",
    isInquiries: true,
  },
  enrollment: {
    icon: <FiBarChart2 className="w-6 h-6" />,
    titleKey: "admissions.enrollment",
    description: "Enrollment statistics & tracking",
    descriptionFr: "Statistiques et suivi des inscriptions",
    isInquiries: false,
  },
};

function StatusBadge({ status, t }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {t(cfg.labelKey)}
    </span>
  );
}

function InquiryCard({ inquiry, onStatusChange, onConvert, t, i18n }) {
  const [updating, setUpdating] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString(
        i18n.language === "fr" ? "fr-FR" : "en-GB",
        { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
      );
    } catch {
      return dateStr;
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === inquiry.status) {
      setShowMenu(false);
      return;
    }
    setUpdating(true);
    try {
      await updateInquiryStatus(inquiry.id, newStatus);
      onStatusChange(inquiry.id, newStatus);
    } catch {
      // error handled silently
    } finally {
      setUpdating(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 overflow-hidden">
      {/* Header with status */}
      <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
            <FiUser className="w-4 h-4 text-teal-700" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {inquiry.parentName}
            </h3>
            <p className="text-xs text-gray-500 truncate">
              {t("admissions.studentName")} : {inquiry.studentName}
            </p>
          </div>
        </div>

        {/* Status + menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={updating}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-50"
          >
            <StatusBadge status={inquiry.status} t={t} />
            <FiChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white rounded-lg border border-gray-200 shadow-lg py-1">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors cursor-pointer ${
                      inquiry.status === s
                        ? "bg-gray-50 text-gray-900 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        STATUS_CONFIG[s].dot
                      }`}
                    />
                    {t(STATUS_CONFIG[s].labelKey)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3">
        {/* Contact info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          <span className="inline-flex items-center gap-1.5 text-gray-500">
            <FiMail className="w-3.5 h-3.5" />
            <a
              href={`mailto:${inquiry.parentEmail}`}
              className="text-teal-700 hover:underline font-medium"
            >
              {inquiry.parentEmail}
            </a>
          </span>
          {inquiry.parentPhone && (
            <span className="inline-flex items-center gap-1.5 text-gray-500">
              <FiPhone className="w-3.5 h-3.5" />
              <a
                href={`tel:${inquiry.parentPhone}`}
                className="text-gray-700 hover:text-teal-700 hover:underline font-medium"
              >
                {inquiry.parentPhone}
              </a>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 text-gray-400 ml-auto">
            <FiCalendar className="w-3.5 h-3.5" />
            {formatDate(inquiry.createdAt)}
          </span>
        </div>

        {/* Student details */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
            {t("admissions.studentName")} : {inquiry.studentName}
          </span>
          {inquiry.studentAge && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">
              {t("admissions.studentAge")} : {inquiry.studentAge}
            </span>
          )}
          {inquiry.grade && (
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-medium">
              {t("admissions.grade")} : {inquiry.grade}
            </span>
          )}
        </div>

        {/* Message */}
        {inquiry.message && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <FiMessageSquare className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {t("admissions.message")}
              </span>
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              {inquiry.message}
            </p>
          </div>
        )}

        {/* Convert to Student button */}
        {(inquiry.status === "new" || inquiry.status === "contacted") && (
          <button
            onClick={() => onConvert(inquiry)}
            className="w-full mt-2 h-9 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer"
          >
            <FiUserPlus className="w-3.5 h-3.5" />
            {t("admissions.convertBtn")}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdmissionsSection() {
  const { t, i18n } = useTranslation("common");
  const location = useLocation();

  const admissionSlug = location.pathname.replace("/dashboard/admissions/", "");
  const meta = ADMISSIONS_META[admissionSlug] || {
    icon: <FiClipboard className="w-6 h-6" />,
    titleKey: "admissions.title",
    description: "Admissions",
    descriptionFr: "Admissions",
    isInquiries: false,
  };

  const lang = i18n.language === "fr" ? "fr" : "en";

  // ── Inquiry management state ──
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [convertModal, setConvertModal] = useState({ open: false, inquiry: null });
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [studentFirstName, setStudentFirstName] = useState("");
  const [studentLastName, setStudentLastName] = useState("");
  const [gender, setGender] = useState("male");
  const [converting, setConverting] = useState(false);
  const PER_PAGE = 12;

  const fetchInquiries = useCallback(async () => {
    if (!meta.isInquiries) return;
    setLoading(true);
    try {
      const params = { limit: PER_PAGE, offset: page * PER_PAGE };
      if (filterStatus) params.status = filterStatus;
      const data = await getEnrolmentInquiries(params);
      setInquiries(data.data?.inquiries || []);
      setTotal(data.data?.total || 0);
    } catch {
      console.warn("Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, meta.isInquiries]);

  useEffect(() => {
    if (meta.isInquiries) fetchInquiries();
  }, [fetchInquiries, meta.isInquiries]);

  const handleStatusChange = (inquiryId, newStatus) => {
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId ? { ...inq, status: newStatus } : inq
      )
    );
  };

  const openConvertModal = async (inquiry) => {
    const nameParts = (inquiry.studentName || "").trim().split(" ");
    setStudentFirstName(nameParts[0] || "");
    setStudentLastName(nameParts.slice(1).join(" ") || "");
    setGender("male");
    setSelectedClassId("");
    setConvertModal({ open: true, inquiry });
    try {
      const data = await getClasses({ limit: 200 });
      setClasses(data.classes || []);
    } catch {
      setClasses([]);
    }
  };

  const closeConvertModal = () => {
    setConvertModal({ open: false, inquiry: null });
  };

  const handleConvert = async () => {
    if (!studentFirstName.trim() || !studentLastName.trim() || !selectedClassId) return;
    setConverting(true);
    const inquiry = convertModal.inquiry;
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    try {
      await createStudent({
        firstName: studentFirstName.trim(),
        lastName: studentLastName.trim(),
        email: inquiry.parentEmail,
        phone: inquiry.parentPhone || "",
        className: selectedClass?.name || "",
        classId: selectedClassId,
        gender,
        status: "active",
        feeStatus: "pending",
      });
      await updateInquiryStatus(inquiry.id, "enrolled");
      handleStatusChange(inquiry.id, "enrolled");
      toast.success(t("admissions.convertSuccess"));
      closeConvertModal();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || t("admissions.convertError");
      toast.error(msg);
    } finally {
      setConverting(false);
    }
  };

  const filtered = inquiries.filter(
    (inq) =>
      !search ||
      inq.parentName?.toLowerCase().includes(search.toLowerCase()) ||
      inq.studentName?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(total / PER_PAGE);

  // ── Enrollment placeholder view ──
  if (!meta.isInquiries) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-2xl shadow-lg">
            {meta.icon}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-surface-800 dark:text-surface-100">
              {t(meta.titleKey, "Enrollment")}
            </h1>
            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
              {lang === "fr" ? meta.descriptionFr : meta.description}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
              <FiUsers className="w-8 h-8 text-surface-400" />
            </div>
            <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
              {t("admissions.comingSoon")}
            </h3>
            <p className="text-sm text-surface-400 max-w-md">
              {t("admissions.comingSoonDesc")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Inquiries management view ──
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center shadow-sm">
            {meta.icon}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {t(meta.titleKey, "Enrolment Inquiries")}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {lang === "fr" ? meta.descriptionFr : meta.description}
            </p>
          </div>
        </div>
        <button
          onClick={fetchInquiries}
          className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer"
          title={t("actions.refresh", "Refresh")}
        >
          <FiRefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("admissions.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal-500"
          >
            <option value="">{t("admissions.allStatus")}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(STATUS_CONFIG[s].labelKey)}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-400">
            {total} {t("admissions.inquiries").toLowerCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FiRefreshCw className="w-6 h-6 text-teal-700 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <FiClipboard className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {t("admissions.noInquiries")}
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              {t("admissions.noInquiriesDesc")}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {filtered.map((inq) => (
              <InquiryCard
                key={inq.id}
                inquiry={inq}
                onStatusChange={handleStatusChange}
                onConvert={(inq) => openConvertModal(inq)}
                t={t}
                i18n={i18n}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-3">
              <p className="text-sm text-gray-500">
                {t("admissions.showing", {
                  from: page * PER_PAGE + 1,
                  to: Math.min((page + 1) * PER_PAGE, total),
                  total,
                })}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="w-9 h-9 rounded-lg hover:bg-gray-100 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                {Array.from(
                  { length: Math.min(totalPages, 5) },
                  (_, i) => {
                    const start = Math.max(
                      0,
                      Math.min(page - 2, totalPages - 5)
                    );
                    return start + i;
                  }
                ).map((p) => (
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
                ))}
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
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

      {/* ── Convert to Student Modal ── */}
      {convertModal.open && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
            onClick={closeConvertModal}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t("admissions.convertModalTitle")}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {t("admissions.convertModalDesc")}
                  </p>
                </div>
                <button
                  onClick={closeConvertModal}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center cursor-pointer flex-shrink-0"
                >
                  <FiX className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 space-y-5">
                {/* Student name */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      {t("admissions.studentFirstName")}
                    </label>
                    <input
                      type="text"
                      value={studentFirstName}
                      onChange={(e) => setStudentFirstName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      {t("admissions.studentLastName")}
                    </label>
                    <input
                      type="text"
                      value={studentLastName}
                      onChange={(e) => setStudentLastName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {t("admissions.gender")}
                  </label>
                  <div className="flex gap-3">
                    {["male", "female"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 h-10 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                          gender === g
                            ? "border-teal-500 bg-teal-50 text-teal-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {t(g === "male" ? "admissions.male" : "admissions.female")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Class selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    {t("admissions.selectClass")}
                  </label>
                  {classes.length === 0 ? (
                    <div className="px-3 py-3 rounded-lg bg-gray-50 text-sm text-gray-400 text-center">
                      {t("admissions.noClasses")}
                    </div>
                  ) : (
                    <select
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none text-sm bg-white"
                    >
                      <option value="">{t("admissions.selectClassPlaceholder")}</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                          {cls.studentCount !== undefined ? ` (${cls.studentCount} ${t("admissions.studentName").toLowerCase()})` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Inquiry info summary */}
                {convertModal.inquiry && (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                    <p>
                      <span className="font-medium">{t("admissions.parentName")}:</span>{" "}
                      {convertModal.inquiry.parentName}
                    </p>
                    <p>
                      <span className="font-medium">{t("admissions.parentEmail")}:</span>{" "}
                      {convertModal.inquiry.parentEmail}
                    </p>
                    {convertModal.inquiry.grade && (
                      <p>
                        <span className="font-medium">{t("admissions.grade")}:</span>{" "}
                        {convertModal.inquiry.grade}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-4 border-t border-gray-100">
                <button
                  onClick={closeConvertModal}
                  className="h-10 px-5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {t("actions.cancel")}
                </button>
                <button
                  onClick={handleConvert}
                  disabled={converting || !studentFirstName.trim() || !studentLastName.trim() || !selectedClassId}
                  className="h-10 px-5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  {converting ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      {t("admissions.converting")}
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      {t("admissions.convertBtn")}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
