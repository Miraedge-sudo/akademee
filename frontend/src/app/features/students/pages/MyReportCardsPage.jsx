/**
 * MyReportCardsPage — Student/Parent report card viewer.
 *
 * Shows published report cards for the logged-in student.
 * Students can view and download their report cards as PDF.
 *
 * Route: /dashboard/my-report-cards
 * Backend: /api/v1/report-cards (list + payload)
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTheme } from "../../../core/hooks/useTheme";
import { useTranslation } from "react-i18next";
import { getStudentMe } from "../../../core/api/studentService";
import {
  listReportCards,
  getReportCardPayload,
} from "../../../core/api/reportCardsService";
import toast from "react-hot-toast";
import {
  FiFileText,
  FiEye,
  FiDownload,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiCheckCircle,
  FiClock,
  FiAward,
  FiBookOpen,
  FiUser,
  FiArrowLeft,
  FiSearch,
} from "react-icons/fi";
import { jsPDF } from "jspdf";
import BulletinTemplate from "../../../components/ui/BulletinTemplate";
import html2canvas from "html2canvas";
import ProgressChart from "../components/ProgressChart";

// ── Score helpers ──
function scoreColor(score) {
  const pct = (score / 20) * 100;
  if (pct >= 60) return "#1D9E75";
  if (pct >= 40) return "#F59E0B";
  return "#EF4444";
}

// ── Status config ──
const STATUS_CONFIG = {
  DRAFT: { label: "Draft", color: "#9CA3AF" },
  COMPLETE: { label: "Complete", color: "#3B82F6" },
  PUBLISHED: { label: "Published", color: "#1D9E75" },
  LOCKED: { label: "Locked", color: "#F59E0B" },
};

// ── Modal backdrop ──
function ModalBackdrop({ open, onClose, title, subtitle, children, width = "max-w-3xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white dark:bg-surface-800 rounded-2xl shadow-2xl w-full ${width} max-h-[85vh] overflow-y-auto border border-surface-100 dark:border-surface-700`}>
        <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-700 sticky top-0 bg-white dark:bg-surface-800 z-10">
          <div>
            <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100">{title}</h3>
            {subtitle && <p className="text-[12px] text-surface-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
            <FiX size={16} className="text-surface-400" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function MyReportCardsPage() {
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const pc = primaryColor || "#085041";
  const isFr = i18n.language === "fr";

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [reportCards, setReportCards] = useState([]);

  // Payload viewer
  const [payloadModal, setPayloadModal] = useState(null);
  const [payloadData, setPayloadData] = useState(null);
  const [payloadLoading, setPayloadLoading] = useState(false);

  // Search / filter
  const [search, setSearch] = useState("");

  // ── Load student profile + report cards ──
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const profile = await getStudentMe();
        setStudent(profile);
        const studentId = profile.id;

        // Only PUBLISHED report cards
        const data = await listReportCards({ studentId, status: "PUBLISHED" });
        setReportCards(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load:", err);
        toast.error(isFr ? "Échec du chargement" : "Failed to load");
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── View payload ──
  const handleViewPayload = async (rc) => {
    setPayloadModal(rc);
    setPayloadData(null);
    setPayloadLoading(true);
    try {
      const data = await getReportCardPayload(rc.report_card_id);
      setPayloadData(data);
    } catch (err) {
      toast.error(err.response?.data?.message || (isFr ? "Échec du chargement" : "Failed to load"));
    }
    setPayloadLoading(false);
  };

  // ── Download PDF ──
  const handleDownloadPDF = async () => {
    const container = document.getElementById("report-card-payload");
    if (!container || !payloadData) return;
    try {
      const origOverflow = container.style.overflow;
      const origMaxHeight = container.style.maxHeight;
      container.style.overflow = "visible";
      container.style.maxHeight = "none";

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      container.style.overflow = origOverflow;
      container.style.maxHeight = origMaxHeight;

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const name = (payloadData?.student?.full_name || "report-card").replace(/[^a-zA-Z0-9]/g, "-");
      pdf.save(`bulletin-${name}.pdf`);
      toast.success(isFr ? "PDF téléchargé !" : "PDF downloaded!");
    } catch {
      toast.error(isFr ? "Échec du téléchargement" : "Download failed");
    }
  };

  // ── Filter ──
  const filteredCards = reportCards.filter((rc) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (rc.period_name || "").toLowerCase().includes(q) ||
      (rc.student_name || "").toLowerCase().includes(q)
    );
  });

  // ── Stats ──
  const totalCards = reportCards.length;
  const latestAvg =
    reportCards.length > 0
      ? Math.max(...reportCards.map((r) => Number(r.general_average) || 0))
      : 0;

  // ── Render ──
  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-5">
      <style>{`
        @keyframes mrFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mr-fade { animation: mrFadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }

        /* ── Print Styles ── */
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .fixed.inset-0 { position: static !important; }
          .absolute.inset-0.bg-black\/40 { display: none !important; }
          .max-h-\[85vh\] {
            max-height: none !important;
            overflow: visible !important;
          }
          #rc-payload-content {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: visible !important;
            max-height: none !important;
            width: 100% !important;
          }
          #rc-payload-content * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
          #rc-payload-content button,
          #rc-payload-content .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-break-inside { page-break-inside: avoid; break-inside: avoid; }
          .print-break-after { page-break-after: always; break-after: page; }
          /* Report card table print styles */
          #rc-payload-content .grid { display: grid !important; }
          #rc-payload-content .lg\:hidden { display: block !important; }
          #rc-payload-content .divide-y > * {
            border-bottom: 1px solid #e5e7eb !important;
          }
          #rc-payload-content [class*="text-surface"] {
            color: #374151 !important;
          }
          #rc-payload-content [class*="bg-surface-50"] {
            background: #f9fafb !important;
          }
          #rc-payload-content [class*="border-surface"] {
            border-color: #e5e7eb !important;
          }
          @page {
            size: A4 portrait;
            margin: 15mm 12mm;
          }
        }
      `}</style>

      {/* ── Header ── */}
      <div
        className="mr-fade relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10">
          <button
            onClick={() => navigate("/dashboard/student-home")}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-[12px] font-medium mb-3 transition-colors"
          >
            <FiArrowLeft size={14} />
            {isFr ? "Retour au tableau de bord" : "Back to dashboard"}
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <FiFileText size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight">
                {isFr ? "Mes Bulletins" : "My Report Cards"}
              </h1>
              <p className="text-white/70 text-sm">
                {student?.fullName
                  ? `${student.fullName}${student?.className ? ` · ${student.className}` : ""}`
                  : (isFr ? "Consultez vos bulletins scolaires" : "View your report cards")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="mr-fade grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ animationDelay: "0.04s" }}>
        {[
          { icon: FiFileText, value: totalCards, label: isFr ? "Bulletins" : "Report Cards", color: "#3B82F6" },
          { icon: FiAward, value: latestAvg > 0 ? `${latestAvg.toFixed(1)}/20` : "-", label: isFr ? "Meilleure moyenne" : "Best Average", color: "#1D9E75" },
          { icon: FiBookOpen, value: reportCards.filter(r => Number(r.general_average) >= 10).length, label: isFr ? "Réussites" : "Passed", color: "#8B5CF6" },
          { icon: FiClock, value: reportCards.filter(r => Number(r.general_average) < 10).length, label: isFr ? "Échecs" : "Failed", color: "#F59E0B" },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-800 rounded-xl border-[1.5px] border-surface-100 dark:border-surface-700 p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${stat.color}15` }}>
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
              <div>
                <div className="text-[18px] font-extrabold text-surface-900 dark:text-surface-100">{stat.value}</div>
                <div className="text-[11px] text-surface-400">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Progress Chart ── */}
      {reportCards.length >= 2 && (
        <ProgressChart
          data={reportCards}
          primaryColor={pc}
          isFr={isFr}
        />
      )}

      {/* ── Report Cards List ── */}
      <div className="mr-fade" style={{ animationDelay: "0.06s" }}>
        <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden">
          {/* Header with search */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center gap-2">
              <FiFileText size={16} className="text-surface-400" />
              <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100">
                {isFr ? "Mes bulletins publiés" : "My Published Report Cards"}
              </h3>
            </div>
            <div className="relative w-48">
              <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isFr ? "Filtrer..." : "Filter..."}
                className="w-full h-8 pl-8 pr-3 bg-surface-50 dark:bg-surface-900 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-lg text-[12px] text-surface-700 dark:text-surface-200 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 transition-colors"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-4 border-2 border-dashed border-surface-200 dark:border-surface-600">
                <FiFileText size={28} className="text-surface-300" />
              </div>
              <h3 className="text-base font-semibold text-surface-700 dark:text-surface-200 mb-1">
                {isFr ? "Aucun bulletin publié" : "No published report cards"}
              </h3>
              <p className="text-sm text-surface-400 max-w-sm">
                {isFr
                  ? "Vos bulletins apparaîtront ici une fois que l'administration les aura publiés."
                  : "Your report cards will appear here once the administration publishes them."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
              {filteredCards.map((rc, idx) => {
                const avg = rc.general_average != null ? Number(rc.general_average) : null;
                const avgColor = avg ? scoreColor(avg) : "#9CA3AF";
                const cfg = STATUS_CONFIG[rc.status] || STATUS_CONFIG.DRAFT;

                return (
                  <div
                    key={rc.report_card_id}
                    className="mr-fade flex items-center gap-3 px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors"
                    style={{ animationDelay: `${0.08 + idx * 0.04}s` }}
                  >
                    {/* Period icon */}
                    <div className="w-10 h-10 rounded-xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center flex-shrink-0 border border-surface-100 dark:border-surface-700">
                      <FiClock size={16} className="text-surface-400" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-surface-900 dark:text-surface-100 truncate">
                        {rc.period_name || (isFr ? "Période" : "Period")}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {/* Status badge */}
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                          style={{ background: `${cfg.color}15`, color: cfg.color }}
                        >
                          {rc.status === "PUBLISHED" && <FiCheckCircle size={10} />}
                          {cfg.label}
                        </span>
                        {/* Avg */}
                        {avg != null && (
                          <span className="text-[12px] font-extrabold tabular-nums" style={{ color: avgColor }}>
                            {avg.toFixed(2)}/20
                          </span>
                        )}
                        {/* Rank */}
                        {rc.class_rank && (
                          <span className="text-[11px] text-surface-400">
                            · #{rc.class_rank}/{rc.class_size || "?"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleViewPayload(rc)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors text-surface-400 hover:text-surface-700 dark:hover:text-surface-200"
                        title={isFr ? "Voir le bulletin" : "View report card"}
                      >
                        <FiEye size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* MODAL: Payload Viewer — Bulletin Scolaire */}
      <ModalBackdrop
        open={!!payloadModal}
        onClose={() => { setPayloadModal(null); setPayloadData(null); }}
        title={isFr ? "Bulletin Scolaire" : "Report Card"}
        subtitle={payloadModal?.period_name || ""}
        width="max-w-4xl"
      >
        {payloadLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: pc }} />
              <div className="absolute inset-0 rounded-full bg-white dark:bg-surface-800 shadow-lg flex items-center justify-center border-2" style={{ borderColor: pc }}>
                <FiFileText size={22} className="animate-pulse" style={{ color: pc }} />
              </div>
            </div>
            <span className="text-[14px] font-semibold text-surface-500 dark:text-surface-400">
              {isFr ? "Chargement du bulletin..." : "Loading report card..."}
            </span>
          </div>
        ) : payloadData ? (
          <div className="space-y-4">
            <div id="report-card-payload">
              <BulletinTemplate payload={payloadData} schoolName={user?.schoolName} />
            </div>

            <div className="flex justify-end gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="h-9 px-4 rounded-xl text-[12px] font-semibold text-surface-700 dark:text-surface-200 bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 transition-all flex items-center gap-1.5"
              >
                <FiFileText size={13} />
                {isFr ? "🖨️ Imprimer" : "🖨️ Print"}
              </button>
              <button
                onClick={handleDownloadPDF}
                className="h-9 px-4 rounded-xl text-[12px] font-semibold text-white transition-all hover:scale-105 hover:shadow-md flex items-center gap-1.5"
                style={{ background: pc }}
              >
                <FiDownload size={13} />
                {isFr ? "📥 Télécharger PDF" : "📥 Download PDF"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-surface-400">
            {isFr ? "Impossible de charger les détails du bulletin" : "Unable to load report card details"}
          </div>
        )}
      </ModalBackdrop>
    </div>
  );
}
