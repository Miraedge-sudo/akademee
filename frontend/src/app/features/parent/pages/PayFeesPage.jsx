/**
 * PayFeesPage — Parent fee payment portal.
 *
 * Features:
 *  - Lists all children with their fee breakdown
 *  - Lets the parent pay any fee (cash / mobile money)
 *  - Shows recent payment history for all children
 *
 * Route: /dashboard/pay-fees
 */
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useTheme } from "../../../core/hooks/useTheme";
import { getMyFees, payFee, getMyPayments } from "../../../core/api/parentService";
import {
  FiCreditCard,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
  FiUser,
  FiFileText,
} from "react-icons/fi";

const STATUS_STYLE = {
  paid: { bg: "bg-emerald-50", text: "text-emerald-600", icon: FiCheckCircle },
  partial: { bg: "bg-amber-50", text: "text-amber-600", icon: FiClock },
  pending: { bg: "bg-red-50", text: "text-red-600", icon: FiAlertTriangle },
  none: { bg: "bg-gray-50", text: "text-gray-500", icon: FiClock },
};

function initials(name) {
  return (name || "").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatCurrency(val) {
  return Number(val || 0).toLocaleString("en") + " FCFA";
}

function formatDate(dateStr, locale) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function PayFeesPage() {
  const { t, i18n } = useTranslation("common");
  const { primaryColor } = useTheme();
  const pc = primaryColor || "#085041";
  const isFr = i18n.language === "fr";

  const [loading, setLoading] = useState(true);
  const [childrenData, setChildrenData] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expandedChild, setExpandedChild] = useState(null);

  // Payment form state
  const [paying, setPaying] = useState(false);
  const [payTarget, setPayTarget] = useState(null); // { childId, fee }
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fees, pmts] = await Promise.all([
        getMyFees().catch(() => []),
        getMyPayments().catch(() => []),
      ]);
      setChildrenData(Array.isArray(fees) ? fees : []);
      setPayments(Array.isArray(pmts) ? pmts : []);
    } catch {
      setChildrenData([]);
      setPayments([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openPayModal = (child, fee) => {
    setPayTarget({ child, fee });
    setAmount(String(fee.balance > 0 ? fee.balance : fee.amountDue));
    setMethod("cash");
  };

  const handlePay = async () => {
    if (!payTarget) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) {
      toast.error(isFr ? "Montant invalide" : "Invalid amount");
      return;
    }
    setPaying(true);
    try {
      await payFee({
        studentId: payTarget.child.id,
        feeId: payTarget.fee.feeId,
        amount: amt,
        method,
        academicYearId: payTarget.fee.academicYearId || null,
      });
      toast.success(isFr ? "Paiement effectué avec succès" : "Payment successful");
      setPayTarget(null);
      load();
    } catch (err) {
      const msg = err?.response?.data?.message || (isFr ? "Échec du paiement" : "Payment failed");
      toast.error(msg);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-44 rounded-2xl" style={{ background: `${pc}15` }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-64 rounded-2xl bg-gray-100 dark:bg-surface-800" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* ── Header ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
              <FiDollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight">
                {t("parent.payFees.title", "Pay Fees")}
              </h1>
              <p className="text-white/70 text-sm">
                {t("parent.payFees.subtitle", "Pay your children's school fees securely")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Children fee cards ── */}
      {childrenData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-surface-800 rounded-2xl border border-gray-200 dark:border-surface-700">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-surface-700 flex items-center justify-center mb-4 border-2 border-dashed border-gray-200 dark:border-surface-600">
            <FiUser className="w-8 h-8 text-gray-300 dark:text-surface-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-surface-200">
            {t("parent.noChildren")}
          </h3>
          <p className="text-sm text-gray-400 max-w-sm mt-1">{t("parent.noChildrenDesc")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {childrenData.map((child) => {
            const summary = child.summary || {};
            const isExpanded = expandedChild === child.id;
            return (
              <div key={child.id} className="bg-white dark:bg-surface-800 rounded-xl border border-gray-200 dark:border-surface-700 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none hover:bg-gray-50/50 dark:hover:bg-surface-900/30 transition-colors"
                  onClick={() => setExpandedChild(isExpanded ? null : child.id)}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: `${pc}12`, color: pc }}>
                    {initials(child.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 dark:text-surface-100 truncate">{child.fullName}</div>
                    <div className="text-xs text-gray-400 truncate">
                      {child.className || child.classLabel || t("parent.notAssigned")}
                      {child.studentNumber ? ` · ${child.studentNumber}` : ""}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-extrabold" style={{ color: (summary.balance || 0) > 0 ? "#F59E0B" : "#059669" }}>
                      {formatCurrency(summary.balance || 0)}
                    </div>
                    <div className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold">{t("parent.left")}</div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2">
                    {(child.fees || []).length === 0 ? (
                      <div className="text-center py-4 text-xs text-gray-400">{t("student.fees.noFeesApplicable")}</div>
                    ) : (
                      child.fees.map((fee) => {
                        const st = STATUS_STYLE[fee.status] || STATUS_STYLE.pending;
                        const Icon = st.icon;
                        return (
                          <div key={fee.feeId} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-surface-900/30 border border-gray-100 dark:border-surface-700/50">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${st.bg}`}>
                              <Icon className={`w-4 h-4 ${st.text}`} />
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold text-gray-800 dark:text-surface-200 truncate">{fee.feeName}</div>
                              <div className="text-[10px] text-gray-400">
                                {formatCurrency(fee.amountPaid)} / {formatCurrency(fee.amountDue)}
                                {fee.dueDate ? ` · ${t("student.fees.dueDate")}: ${formatDate(fee.dueDate, isFr)}` : ""}
                              </div>
                            </div>
                            {fee.balance > 0 ? (
                              <button
                                onClick={() => openPayModal(child, fee)}
                                className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-lg text-white cursor-pointer transition-all hover:opacity-90 flex-shrink-0"
                                style={{ background: pc }}
                              >
                                <FiCreditCard className="w-3.5 h-3.5" />
                                {t("parent.payFees.payBtn", "Pay")}
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                <FiCheckCircle className="w-3 h-3" />
                                {t("parent.statusPaid")}
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                <div className="px-5 pb-3.5">
                  <button
                    onClick={() => setExpandedChild(isExpanded ? null : child.id)}
                    className="w-full flex items-center justify-center gap-1 text-[11px] font-medium text-gray-400 hover:text-gray-600 dark:hover:text-surface-300 transition-colors cursor-pointer"
                  >
                    {isExpanded ? t("parent.showLess") : t("parent.moreDetails")}
                    {isExpanded ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Payment history ── */}
      {payments.length > 0 && (
        <div className="bg-white dark:bg-surface-800 rounded-2xl border border-gray-200 dark:border-surface-700 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-surface-700">
            <FiFileText className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-surface-100">
              {t("parent.payFees.history", "Payment history")}
            </h3>
            <span className="text-[11px] text-gray-400 ml-auto">{payments.length}</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-surface-700/50">
            {payments.slice(0, 8).map((p) => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-50 dark:bg-emerald-900/20">
                  <FiCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-gray-800 dark:text-surface-200 truncate">
                    {p.feeName || t("parent.payFees.payment", "Payment")}
                  </div>
                  <div className="text-[11px] text-gray-400">
                    {p.studentName} · {formatDate(p.createdAt, isFr)}
                    {p.method ? ` · ${p.method}` : ""}
                    {p.reference ? ` · #${p.reference}` : ""}
                  </div>
                </div>
                <div className="text-[14px] font-extrabold text-gray-800 dark:text-surface-100 flex-shrink-0">
                  {formatCurrency(p.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pay modal ── */}
      {payTarget && (
        <div className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPayTarget(null)}>
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-surface-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-surface-100">
                {t("parent.payFees.payFor", "Pay fee")}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {payTarget.child.fullName} · {payTarget.fee.feeName}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-surface-900/30">
                  <div className="text-gray-400">{t("student.fees.totalDue")}</div>
                  <div className="text-[13px] font-bold text-gray-800 dark:text-surface-200">{formatCurrency(payTarget.fee.amountDue)}</div>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-surface-900/30">
                  <div className="text-gray-400">{t("student.fees.totalPaid")}</div>
                  <div className="text-[13px] font-bold text-emerald-600">{formatCurrency(payTarget.fee.amountPaid)}</div>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-surface-900/30">
                  <div className="text-gray-400">{t("parent.left")}</div>
                  <div className="text-[13px] font-bold text-amber-600">{formatCurrency(payTarget.fee.balance)}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-surface-300 mb-1.5">
                  {t("parent.payFees.amount", "Amount")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-surface-300 mb-1.5">
                  {t("parent.payFees.method", "Method")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "cash", label: t("parent.payFees.cash", "Cash") },
                    { value: "mobile", label: t("parent.payFees.mobile", "Mobile money") },
                    { value: "bank", label: t("parent.payFees.bank", "Bank transfer") },
                    { value: "card", label: t("parent.payFees.card", "Card") },
                  ].map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMethod(m.value)}
                      className={`h-10 rounded-lg border text-[12px] font-semibold transition-all cursor-pointer ${
                        method === m.value
                          ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300"
                          : "border-gray-200 dark:border-surface-600 text-gray-600 dark:text-surface-400 hover:bg-gray-50 dark:hover:bg-surface-900"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-4 border-t border-gray-100 dark:border-surface-700">
              <button
                onClick={() => setPayTarget(null)}
                className="h-10 px-5 rounded-lg border border-gray-200 dark:border-surface-600 text-sm font-medium text-gray-600 dark:text-surface-400 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {t("actions.cancel")}
              </button>
              <button
                onClick={handlePay}
                disabled={paying}
                className="h-10 px-6 rounded-lg text-white text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                style={{ background: pc }}
              >
                {paying ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiCreditCard className="w-4 h-4" />}
                {paying ? (isFr ? "Traitement..." : "Processing...") : (isFr ? "Payer" : "Pay")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
