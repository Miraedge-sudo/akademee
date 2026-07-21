/**
 * ParentDashboardPage — Parent portal home with KPIs for all children.
 *
 * Features:
 *  - Lists all children with their class info
 *  - Per-child cards showing: fee status, latest grades, attendance rate
 *  - Global announcements feed
 *  - Quick stats overview
 *
 * Route: /dashboard/parent-home
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTheme } from "../../../core/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { getMyChildren } from "../../../core/api/parentService";
import { getStudentFeeSummary } from "../../../core/api/feeCalculationService";
import { getStudentAverages } from "../../../core/api/gradeCalculationService";
import { getAttendanceStats } from "../../../core/api/attendanceService";
import { getAnnouncements } from "../../../core/api/announcementService";
import {
  FiUsers,
  FiBookOpen,
  FiDollarSign,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiCalendar,
  FiChevronRight,
  FiRefreshCw,
  FiArrowRight,
  FiFileText,
  FiTrendingUp,
  FiUser,
  FiMail,
  FiPhone,
  FiHeart,
} from "react-icons/fi";

const pc = "#085041";

function initials(name) {
  return (name || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatCurrency(val) {
  return Number(val || 0).toLocaleString("en") + " FCFA";
}

export default function ParentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("common");

  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [childrenData, setChildrenData] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [expandedChild, setExpandedChild] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [myChildren, announceRes] = await Promise.all([
          getMyChildren(),
          getAnnouncements().catch(() => []),
        ]);
        const childList = Array.isArray(myChildren) ? myChildren : [];
        setChildren(childList);
        setAnnouncements(Array.isArray(announceRes) ? announceRes : announceRes?.announcements || []);

        // Fetch KPIs for each child in parallel
        const dataMap = {};
        const childPromises = childList.map(async (child) => {
          try {
            const [summary, averages, attStats] = await Promise.all([
              getStudentFeeSummary(child.id).catch(() => null),
              getStudentAverages(child.id).catch(() => null),
              getAttendanceStats({ studentId: child.id }).catch(() => null),
            ]);
            dataMap[child.id] = {
              feeSummary: summary,
              averages: averages,
              attendance: attStats,
            };
          } catch {
            dataMap[child.id] = { feeSummary: null, averages: null, attendance: null };
          }
        });
        await Promise.all(childPromises);
        setChildrenData(dataMap);
      } catch (err) {
        console.error("Failed to load parent data:", err);
        setError(t("parent.error"));
      }
      setLoading(false);
    }
    load();
  }, [i18n.language, t]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-44 rounded-2xl" style={{ background: `${pc}15` }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-gray-100" />
          ))}
        </div>
        <div className="h-48 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <FiAlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {t("teacher.myClasses.errorTitle")}
        </h3>
        <p className="text-sm text-gray-400">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-6 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
          style={{ background: pc }}
        >
          <FiRefreshCw className="w-4 h-4" />
          {t("teacher.myClasses.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <style>{`
        @keyframes pdfadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pd-fade { animation: pdfadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* ── Header ── */}
      <div
        className="pd-fade relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
              <FiHeart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight">
                {t("parent.portal")}
              </h1>
              <p className="text-white/70 text-sm">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-white/80 text-xs">
              <FiUsers className="w-3.5 h-3.5" />
              <span>
                {children.length} {t("parent.childLabel", { count: children.length })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Children Grid ── */}
      {children.length === 0 ? (
        <div className="pd-fade flex flex-col items-center justify-center py-16 text-center" style={{ animationDelay: "0.05s" }}>
          <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mb-5 border-2 border-dashed border-gray-200">
            <FiUser className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1.5">
            {t("parent.noChildren")}
          </h3>
          <p className="text-sm text-gray-400 max-w-sm">
            {t("parent.noChildrenDesc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {children.map((child, idx) => {
            const data = childrenData[child.id] || {};
            const feeSummary = data.feeSummary || {};
            const averages = data.averages || {};
            const totalDue = feeSummary.totalDue || feeSummary.totalFees || 0;
            const totalPaid = feeSummary.totalPaid || 0;
            const feeStatus = feeSummary.status || child.feeStatus || "pending";
            const paidPct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
            const annualAvg = averages.overallAverage || 0;
            const isExpanded = expandedChild === child.id;

            return (
              <div
                key={child.id}
                className="pd-fade bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
                style={{ animationDelay: `${0.05 + idx * 0.04}s` }}
              >
                {/* Child Header */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-gray-50/50 transition-colors"
                  onClick={() => setExpandedChild(isExpanded ? null : child.id)}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: `${pc}12`, color: pc }}
                  >
                    {initials(child.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">
                      {child.fullName}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {child.className || child.classLabel || t("parent.notAssigned")}
                      {child.studentNumber ? ` · ${child.studentNumber}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Fee status badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${
                        feeStatus === "paid"
                          ? "bg-emerald-50 text-emerald-600"
                          : feeStatus === "partial"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {feeStatus === "paid" ? (
                        <FiCheckCircle size={10} />
                      ) : feeStatus === "partial" ? (
                        <FiClock size={10} />
                      ) : (
                        <FiAlertTriangle size={10} />
                      )}
                      {feeStatus === "paid"
                        ? t("parent.statusPaid")
                        : feeStatus === "partial"
                        ? t("parent.statusPartial")
                        : t("parent.statusUnpaid")}
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="px-5 pb-3">
                  <div className="grid grid-cols-3 gap-2">
                    {/* Fee progress */}
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <div className="text-[16px] font-extrabold" style={{ color: paidPct >= 100 ? "#059669" : pc }}>
                        {paidPct}%
                      </div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">
                        {t("parent.feeProgress")}
                      </div>
                    </div>
                    {/* Average */}
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <div className="text-[16px] font-extrabold" style={{ color: annualAvg >= 10 ? "#059669" : "#F59E0B" }}>
                        {annualAvg > 0 ? annualAvg.toFixed(1) : "-"}
                      </div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">
                        {t("parent.average")}
                      </div>
                    </div>
                    {/* Payments count */}
                    <div className="text-center p-2 rounded-lg bg-gray-50">
                      <div className="text-[16px] font-extrabold text-gray-700">
                        {totalPaid > 0 ? formatCurrency(totalPaid) : "-"}
                      </div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">
                        {t("parent.paid")}
                      </div>
                    </div>
                  </div>

                  {/* Fee progress bar */}
                  {totalDue > 0 && (
                    <div className="mt-3 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(paidPct, 100)}%`,
                          background: paidPct >= 100 ? "#059669" : paidPct > 0 ? "#F59E0B" : "#EF4444",
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mx-4 mb-4 px-4 py-3 rounded-lg bg-gray-50 border border-gray-100 space-y-3">
                    {/* Attendance stats */}
                    {data.attendance && (
                      <div>
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <FiClock size={12} />
                          {t("parent.attendance")}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-gray-500">{t("parent.attendanceRate")}:</span>
                            <span className="text-[13px] font-bold text-emerald-600">
                              {data.attendance.attendanceRate || data.attendance.rate || 0}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-gray-500">{t("parent.absences")}:</span>
                            <span className="text-[13px] font-bold text-red-500">
                              {(data.attendance.absent || 0) + (data.attendance.late || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Grade summary */}
                    {averages && averages.subjects && averages.subjects.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <FiBookOpen size={12} />
                          {t("parent.recentGrades")}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {averages.subjects.slice(0, 5).map((subj, si) => (
                            <span
                              key={si}
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                subj.average >= 10 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                              }`}
                            >
                              {subj.subjectName || subj.name}: {subj.average?.toFixed(1) || "-"}
                            </span>
                          ))}
                          {averages.subjects.length > 5 && (
                            <span className="text-[10px] text-gray-400 font-medium">
                              +{averages.subjects.length - 5} {t("parent.otherSubjects")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Fee detail */}
                    {totalDue > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                          <FiDollarSign size={12} />
                          {t("parent.feeSummary")}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                          <div>
                            <span className="text-gray-500">{t("parent.due")}:</span>{" "}
                            <span className="font-bold text-gray-700">{formatCurrency(totalDue)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">{t("parent.paid")}:</span>{" "}
                            <span className="font-bold text-emerald-600">{formatCurrency(totalPaid)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">{t("parent.left")}:</span>{" "}
                            <span className="font-bold" style={{ color: totalDue - totalPaid > 0 ? "#F59E0B" : "#059669" }}>
                              {formatCurrency(Math.max(0, totalDue - totalPaid))}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => navigate(`/dashboard/my-fees?studentId=${child.id}`)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg text-white cursor-pointer transition-all hover:opacity-90"
                        style={{ background: pc }}
                      >
                        <FiDollarSign size={12} />
                        {t("parent.viewFees")}
                      </button>
                      <button
                        onClick={() => navigate(`/dashboard/my-grades?studentId=${child.id}`)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border cursor-pointer transition-all hover:bg-gray-50"
                        style={{ borderColor: pc, color: pc }}
                      >
                        <FiFileText size={12} />
                        {t("parent.viewGrades")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Footer link */}
                <div className="px-5 pb-3.5">
                  <button
                    onClick={() => setExpandedChild(isExpanded ? null : child.id)}
                    className="w-full flex items-center justify-center gap-1 text-[11px] font-medium text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {isExpanded
                      ? t("parent.showLess")
                      : t("parent.moreDetails")}
                    <FiChevronRight
                      size={12}
                      className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Announcements Feed ── */}
      <div className="pd-fade bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ animationDelay: "0.12s" }}>
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
          <FiCalendar className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-bold text-gray-800">
            {t("announcements.title")}
          </h3>
        </div>
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <FiCalendar className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">
              {t("announcements.noAnnouncements")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {announcements.slice(0, 5).map((ann, idx) => (
              <div key={ann.id || idx} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50">
                  <FiCalendar size={14} className="text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-gray-800 truncate">
                    {ann.title || ann.message || ""}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-0.5">
                    {ann.createdAt
                      ? new Date(ann.createdAt).toLocaleDateString(i18n.language === "fr" ? "fr-FR" : "en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : ""}
                    {ann.authorName ? ` · ${ann.authorName}` : ""}
                  </div>
                </div>
                {ann.target && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap">
                    {ann.target}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Links ── */}
      <div className="pd-fade grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" style={{ animationDelay: "0.14s" }}>
        {[
          {
            icon: FiDollarSign,
            label: t("parent.quickLinks.payments"),
            desc: t("parent.quickLinks.paymentsDesc"),
            color: "#059669",
            bg: "#ECFDF5",
            onClick: () => navigate("/dashboard/payments"),
          },
          {
            icon: FiFileText,
            label: t("parent.quickLinks.grades"),
            desc: t("parent.quickLinks.gradesDesc"),
            color: "#3B82F6",
            bg: "#EFF6FF",
            onClick: () => navigate("/dashboard/my-grades"),
          },
          {
            icon: FiClock,
            label: t("parent.quickLinks.attendance"),
            desc: t("parent.quickLinks.attendanceDesc"),
            color: "#8B5CF6",
            bg: "#F5F3FF",
            onClick: () => navigate("/dashboard/my-attendance"),
          },
          {
            icon: FiTrendingUp,
            label: t("parent.quickLinks.reportCards"),
            desc: t("parent.quickLinks.reportCardsDesc"),
            color: "#F59E0B",
            bg: "#FFFBEB",
            onClick: () => navigate("/dashboard/report-cards"),
          },
        ].map((item, idx) => (
          <button
            key={idx}
            onClick={item.onClick}
            className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white hover:shadow-sm transition-all text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
              <item.icon size={18} style={{ color: item.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-gray-800">{item.label}</div>
              <div className="text-[11px] text-gray-400 truncate">{item.desc}</div>
            </div>
            <FiArrowRight size={14} className="text-gray-300 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
