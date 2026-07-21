/**
 * ReceiptsPage — Accountant payment receipt management.
 *
 * Features:
 *  - List all payments with search, date range, and status filters
 *  - Payment receipt detail modal
 *  - Print/PDF download via CSS @media print
 *  - Full i18n support via t()
 *
 * Route: /dashboard/receipts
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../core/hooks/useAuth";
import { useTheme } from "../../../core/hooks/useTheme";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import {
  FiChevronLeft,
  FiSearch,
  FiRefreshCw,
  FiPrinter,
  FiDownload,
  FiCheckCircle,
  FiClock,
  FiXCircle,
  FiDollarSign,
  FiCalendar,
  FiFilter,
  FiX,
  FiArrowRight,
} from "react-icons/fi";
import { getPayments, getPaymentById } from "../../../core/api/paymentService";

const STATUS_CONFIG = {
  completed: { color: "#1D9E75", icon: FiCheckCircle, labelEn: "Completed", labelFr: "Complété" },
  pending: { color: "#F59E0B", icon: FiClock, labelEn: "Pending", labelFr: "En attente" },
  failed: { color: "#EF4444", icon: FiXCircle, labelEn: "Failed", labelFr: "Échoué" },
};

const PAYMENT_METHODS_MAP = {
  cash: { en: "Cash", fr: "Espèces" },
  bank_transfer: { en: "Bank Transfer", fr: "Virement bancaire" },
  mobile_money: { en: "Mobile Money", fr: "Mobile Money" },
  cheque: { en: "Cheque", fr: "Chèque" },
  card: { en: "Card", fr: "Carte" },
};

function hexToRgba(hex, alpha = 1) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (r) return `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${alpha})`;
  return `rgba(8,80,65,${alpha})`;
}

function formatDate(dateStr, locale, fmt = "medium") {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (fmt === "short") return d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US");
    return d.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      day: "numeric", month: "long", year: "numeric",
    });
  } catch { return dateStr; }
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

function initials(name) {
  return (name || "").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── Receipt Modal ──
function ReceiptModal({ payment, onClose, t, isFr, schoolName, schoolAddress, pc }) {
  const statusCfg = STATUS_CONFIG[payment?.status] || STATUS_CONFIG.completed;
  const amount = Number(payment?.amount || 0);
  const ref = payment?.reference || payment?.receiptNumber || `#${payment?.id?.slice(0, 8)}`;
  const methodLabel = PAYMENT_METHODS_MAP[payment?.method] || { en: payment?.method, fr: payment?.method };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("receipt-inner");
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`recu-${ref.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`);
    } catch {
      // fallback to print if canvas fails
      window.print();
    }
  };

  if (!payment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        id="receipt-content"
      >
        {/* Print Styles */}
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #receipt-content, #receipt-content * { visibility: visible; }
            #receipt-content {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              max-width: 100%;
              box-shadow: none;
              border-radius: 0;
              margin: 0;
              padding: 0;
            }
            .receipt-no-print { display: none !important; }
            .receipt-print-only { display: block !important; }
            @page { margin: 1.5cm; }
          }
          .receipt-print-only { display: none; }
        `}</style>

        {/* ── Receipt Content ── */}
        <div className="p-6 sm:p-8">
          {/* Close & action buttons — hidden on print */}
          <div className="receipt-no-print flex items-center justify-between mb-5">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <FiChevronLeft size={16} />
              {t("actions.back", "Back")}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPDF}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer hover:bg-gray-50 shadow-sm"
                style={{ borderColor: pc, color: pc }}
              >
                <FiDownload size={15} />
                PDF
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer hover:opacity-90 shadow-sm"
                style={{ background: pc }}
              >
                <FiPrinter size={15} />
                {t("receipts.print", "Print")}
              </button>
            </div>
          </div>

          {/* ══════ RECEIPT ══════ */}
          <div id="receipt-inner" className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
            {/* Header */}
            <div className="p-6 text-center border-b border-gray-100" style={{ background: `${hexToRgba(pc, 0.04)}` }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm" style={{ background: pc }}>
                <FiDollarSign className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{schoolName || "School"}</h2>
              {schoolAddress && (
                <p className="text-[12px] text-gray-500 mt-0.5">{schoolAddress}</p>
              )}
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: `${hexToRgba(pc, 0.08)}`, color: pc }}>
                {t("receipts.receipt", "Payment Receipt")}
              </div>
            </div>

            {/* Receipt Body */}
            <div className="p-6 space-y-5">
              {/* Receipt Number & Date */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                    {t("receipts.receiptNo", "Receipt No.")}
                  </div>
                  <div className="text-[16px] font-extrabold text-gray-900 mt-0.5 font-mono">{ref}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                    {t("receipts.date", "Date")}
                  </div>
                  <div className="text-[13px] font-semibold text-gray-700 mt-0.5">
                    {formatDate(payment.createdAt, isFr)}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {formatTime(payment.createdAt)}
                  </div>
                </div>
              </div>

              {/* Student Info */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: hexToRgba(pc, 0.1), color: pc }}>
                  {initials(payment.studentName)}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-gray-800">{payment.studentName}</div>
                  <div className="text-[11px] text-gray-400">{t("receipts.student", "Student")}</div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3 pb-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-500">{t("receipts.paymentMethod", "Payment Method")}</span>
                  <span className="text-[13px] font-semibold text-gray-700">
                    {isFr ? methodLabel.fr : methodLabel.en}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-gray-500">{t("receipts.status", "Status")}</span>
                  <span
                    className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${statusCfg.color}12`, color: statusCfg.color }}
                  >
                    <statusCfg.icon size={12} />
                    {isFr ? statusCfg.labelFr : statusCfg.labelEn}
                  </span>
                </div>
                {payment.feeName && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">{t("receipts.fee", "Fee")}</span>
                    <span className="text-[13px] font-semibold text-gray-700">{payment.feeName}</span>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[15px] font-bold text-gray-900">
                  {t("receipts.totalPaid", "Total Paid")}
                </span>
                <div className="text-right">
                  <div className="text-[24px] font-extrabold" style={{ color: pc }}>
                    {amount.toLocaleString("en")} FCFA
                  </div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-0.5">
                    {t("receipts.amountInWords", "Amount")}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 text-center border-t border-gray-100 bg-gray-50/50">
              <div className="text-[10px] text-gray-400 leading-relaxed">
                {t("receipts.generatedBy", "Generated by Akademee — School Management System")}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {t("receipts.receiptNote", "This is a computer-generated receipt.")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function ReceiptsPage() {
  const { t, i18n } = useTranslation("common");
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const navigate = useNavigate();
  const isFr = i18n.language === "fr";
  const pc = primaryColor || "#085041";
  const schoolName = user?.schoolName || "";
  const schoolAddress = user?.schoolAddress || user?.city || "";

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100, offset: 0 };
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      const data = await getPayments(params);
      setPayments(data?.payments || []);
      setTotal(data?.total || 0);
    } catch {
      toast.error(isFr ? "Échec du chargement" : "Failed to load");
      setPayments([]);
    }
    setLoading(false);
  }, [statusFilter, dateFrom, dateTo, isFr]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const openReceipt = async (payment) => {
    try {
      const detail = await getPaymentById(payment.id);
      setSelectedPayment(detail);
    } catch {
      setSelectedPayment(payment);
    }
  };

  // Filter by search locally (if API doesn't support search)
  const filtered = search
    ? payments.filter(
        (p) =>
          (p.studentName || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.reference || p.receiptNumber || "").toLowerCase().includes(search.toLowerCase())
      )
    : payments;

  const totalAmount = filtered.reduce((s, p) => s + Number(p.amount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes rcFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rc-fade { animation: rcFadeUp 0.4s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <FiChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <FiPrinter className="w-5 h-5" style={{ color: pc }} />
                <h1 className="text-xl font-bold text-gray-900">
                  {t("receipts.title", "Payment Receipts")}
                </h1>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {t("receipts.subtitle", "View and print payment receipts")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-5">
        {/* ── Filters bar ── */}
        <div className="rc-fade bg-white rounded-xl border border-gray-200 p-4 shadow-sm" style={{ animationDelay: "0.02s" }}>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isFr ? "Rechercher un paiement..." : "Search payments..."}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-gray-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 outline-none text-sm bg-white cursor-pointer"
            >
              <option value="">{isFr ? "Tous les statuts" : "All status"}</option>
              <option value="completed">{isFr ? "Complétés" : "Completed"}</option>
              <option value="pending">{isFr ? "En attente" : "Pending"}</option>
              <option value="failed">{isFr ? "Échoués" : "Failed"}</option>
            </select>

            {/* Date toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all cursor-pointer"
            >
              <FiCalendar size={15} />
              {isFr ? "Dates" : "Dates"}
              <FiFilter size={13} className={showFilters ? "text-teal-600" : ""} />
            </button>

            {/* Refresh */}
            <button
              onClick={fetchPayments}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all cursor-pointer"
            >
              <FiRefreshCw className={`w-4 h-4 text-gray-500 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Date range (collapsible) */}
          {showFilters && (
            <div className="mt-3 flex items-center gap-3 flex-wrap pt-3 border-t border-gray-100">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  {isFr ? "Du" : "From"}
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                  {isFr ? "Au" : "To"}
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-9 px-3 rounded-lg border border-gray-200 text-sm outline-none focus:border-teal-700"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="inline-flex items-center gap-1 text-[12px] text-gray-500 hover:text-red-500 mt-4 cursor-pointer"
                >
                  <FiX size={13} />
                  {isFr ? "Effacer" : "Clear"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Stats summary ── */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: isFr ? "Total paiements" : "Total Payments", value: filtered.length, color: pc },
              { label: isFr ? "Montant total" : "Total Amount", value: `${totalAmount.toLocaleString("en")} FCFA`, color: "#1D9E75" },
              { label: isFr ? "Moyenne" : "Average", value: `${Math.round(totalAmount / filtered.length).toLocaleString("en")} FCFA`, color: "#3B82F6" },
              { label: isFr ? "Aujourd'hui" : "Today", value: payments.filter(p => {
                  const today = new Date().toISOString().split("T")[0];
                  return p.createdAt?.startsWith(today);
                }).length, color: "#8B5CF6" },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{stat.label}</div>
                <div className="text-[18px] font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Payments list ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FiRefreshCw className="w-6 h-6 animate-spin" style={{ color: pc }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <FiPrinter className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {search || statusFilter || dateFrom
                  ? (isFr ? "Aucun résultat" : "No results")
                  : (isFr ? "Aucun paiement" : "No payments")}
              </h3>
              <p className="text-sm text-gray-500">
                {search || statusFilter || dateFrom
                  ? (isFr ? "Aucun paiement ne correspond à votre recherche" : "No payments match your search")
                  : (isFr ? "Les paiements enregistrés apparaîtront ici" : "Recorded payments will appear here")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {/* Table header */}
              <div className="hidden md:flex items-center gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <div className="w-8" />
                <div className="flex-1 min-w-0">{isFr ? "Élève" : "Student"}</div>
                <div className="w-28 text-right">{isFr ? "Montant" : "Amount"}</div>
                <div className="w-28">{isFr ? "Méthode" : "Method"}</div>
                <div className="w-24">{isFr ? "Référence" : "Reference"}</div>
                <div className="w-24 text-center">{isFr ? "Statut" : "Status"}</div>
                <div className="w-20">{isFr ? "Date" : "Date"}</div>
                <div className="w-16 text-right">{isFr ? "Reçu" : "Receipt"}</div>
              </div>

              {filtered.map((pmt, idx) => {
                const statusCfg = STATUS_CONFIG[pmt?.status] || STATUS_CONFIG.completed;
                const methodLabel = PAYMENT_METHODS_MAP[pmt?.method] || { en: pmt?.method, fr: pmt?.method };
                return (
                  <div
                    key={pmt.id || idx}
                    className="rc-fade flex flex-col md:flex-row md:items-center gap-3 px-4 md:px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ animationDelay: `${0.03 * idx}s` }}
                    onClick={() => openReceipt(pmt)}
                  >
                    {/* Avatar (desktop) */}
                    <div className="hidden md:flex w-8">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ background: hexToRgba(pc, 0.1), color: pc }}>
                        {initials(pmt.studentName)}
                      </div>
                    </div>

                    {/* Mobile layout */}
                    <div className="flex items-center gap-3 md:hidden">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: hexToRgba(pc, 0.1), color: pc }}>
                        {initials(pmt.studentName)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">{pmt.studentName}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <span>{isFr ? methodLabel.fr : methodLabel.en}</span>
                          <span>·</span>
                          <span>{formatDate(pmt.createdAt, isFr, "short")}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-extrabold" style={{ color: pc }}>
                          {Number(pmt.amount).toLocaleString("en")} FCFA
                        </div>
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: `${statusCfg.color}12`, color: statusCfg.color }}>
                          <statusCfg.icon size={9} />
                          {isFr ? statusCfg.labelFr : statusCfg.labelEn}
                        </span>
                      </div>
                    </div>

                    {/* Desktop columns */}
                    <div className="hidden md:block flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{pmt.studentName}</div>
                    </div>

                    <div className="hidden md:block w-28 text-right">
                      <span className="text-sm font-bold" style={{ color: pc }}>
                        {Number(pmt.amount).toLocaleString("en")} FCFA
                      </span>
                    </div>

                    <div className="hidden md:block w-28">
                      <span className="text-xs text-gray-500">{isFr ? methodLabel.fr : methodLabel.en}</span>
                    </div>

                    <div className="hidden md:block w-24">
                      <span className="text-xs font-mono text-gray-500 truncate block">{pmt.reference || pmt.receiptNumber || "-"}</span>
                    </div>

                    <div className="hidden md:flex w-24 justify-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${statusCfg.color}12`, color: statusCfg.color }}>
                        <statusCfg.icon size={11} />
                        {isFr ? statusCfg.labelFr : statusCfg.labelEn}
                      </span>
                    </div>

                    <div className="hidden md:block w-20">
                      <span className="text-xs text-gray-500">{formatDate(pmt.createdAt, isFr, "short")}</span>
                    </div>

                    <div className="hidden md:flex w-16 justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); openReceipt(pmt); }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-teal-50 transition-colors cursor-pointer"
                        title={isFr ? "Voir le reçu" : "View receipt"}
                        style={{ color: pc }}
                      >
                        <FiArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        t={t}
        isFr={isFr}
        schoolName={schoolName}
        schoolAddress={schoolAddress}
        pc={pc}
      />
    </div>
  );
}
