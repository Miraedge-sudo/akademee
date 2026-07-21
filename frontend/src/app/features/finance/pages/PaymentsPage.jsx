/**
 * PaymentsPage — Accountant payment recording interface.
 *
 * Features:
 *  - Search students by name
 *  - View student fee status (total due, paid, remaining)
 *  - Select which fee to pay
 *  - Enter amount and payment method
 *  - Record payment with receipt number
 *  - View recent payments history
 *
 * Route: /dashboard/payments
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  FiChevronLeft,
  FiDollarSign,
  FiSearch,
  FiUser,
  FiRefreshCw,
  FiCheck,
  FiCreditCard,
  FiPrinter,
  FiClock,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { getStudents } from "../../../core/api/studentService";
import { getFees } from "../../../core/api/feeService";
import { createPayment, getPayments } from "../../../core/api/paymentService";
import { getStudentFeeSummary } from "../../../core/api/feeCalculationService";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_money", label: "Mobile Money" },
  { value: "cheque", label: "Cheque" },
  { value: "card", label: "Card" },
];

function hexToRgba(hex, alpha) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (r) return `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${alpha})`;
  return `rgba(8,80,65,${alpha})`;
}

function initials(name) {
  return (name || "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function PaymentsPage() {
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const isFr = i18n.language === "fr";
  const pc = "#085041";

  // ── State ──
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [allFees, setAllFees] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  // Payment form
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [feeId, setFeeId] = useState("");
  const [reference, setReference] = useState("");

  // ── Load initial data ──
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [feesData, paymentsData] = await Promise.all([
          getFees({ limit: 500 }).catch(() => ({ fees: [] })),
          getPayments({ limit: 10 }).catch(() => ({ payments: [] })),
        ]);
        setAllFees(Array.isArray(feesData) ? feesData : feesData?.fees || []);
        const payList = Array.isArray(paymentsData) ? paymentsData : paymentsData?.payments || [];
        setRecentPayments(payList);
      } catch {
        //
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── Search students ──
  const searchStudents = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setStudents([]);
      return;
    }
    try {
      const data = await getStudents({ search: query, limit: 10 });
      const list = Array.isArray(data) ? data : data?.students || [];
      setStudents(list);
    } catch {
      setStudents([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchStudents(studentSearch), 300);
    return () => clearTimeout(timer);
  }, [studentSearch, searchStudents]);

  // ── Select a student ──
  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setStudents([]);
    setStudentSearch(`${student.fullName || student.firstName || ""} ${student.lastName || ""}`);
    setAmount("");
    setFeeId("");
    setReference("");

    try {
      const summary = await getStudentFeeSummary(student.id);
      setFeeSummary(summary);
    } catch {
      setFeeSummary(null);
    }
  };

  // ── Record payment ──
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return toast.error(isFr ? "Sélectionnez un élève" : "Select a student");
    if (!feeId) return toast.error(isFr ? "Sélectionnez un frais" : "Select a fee");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error(isFr ? "Entrez un montant valide" : "Enter a valid amount");

    setSubmitting(true);
    try {
      const result = await createPayment({
        studentId: selectedStudent.id,
        amount: amt,
        method,
        feeId,
        reference: reference.trim() || undefined,
      });

      toast.success(
        isFr
          ? `Paiement de ${amt.toLocaleString('en')} FCFA enregistré ! Réf: ${result.reference || result.receiptNumber || ""}`
          : `Payment of ${amt.toLocaleString('en')} FCFA recorded! Ref: ${result.reference || result.receiptNumber || ""}`
      );

      // Reset form and refresh
      setAmount("");
      setReference("");
      try {
        const updated = await getStudentFeeSummary(selectedStudent.id);
        setFeeSummary(updated);
        const payData = await getPayments({ limit: 10 });
        setRecentPayments(Array.isArray(payData) ? payData : payData?.payments || []);
      } catch {
        //
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || (isFr ? "Échec de l'enregistrement" : "Failed to record payment"));
    }
    setSubmitting(false);
  };

  // ── Clear student selection ──
  const clearStudent = () => {
    setSelectedStudent(null);
    setStudentSearch("");
    setStudents([]);
    setFeeSummary(null);
    setAmount("");
    setFeeId("");
    setReference("");
  };

  const totalDue = feeSummary?.totalDue || feeSummary?.totalFees || 0;
  const totalPaid = feeSummary?.totalPaid || 0;
  const balance = Math.max(0, totalDue - totalPaid);
  const paidPct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;

  const formatCurrency = (val) => Number(val || 0).toLocaleString("en") + " FCFA";

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @keyframes pmFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pm-fade { animation: pmFadeUp 0.4s cubic-bezier(.16,1,.3,1) both; }
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
                <FiDollarSign className="w-5 h-5" style={{ color: pc }} />
                <h1 className="text-xl font-bold text-gray-900">
                  {isFr ? "Enregistrement de paiement" : "Payment Recording"}
                </h1>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {isFr ? "Enregistrer les paiements des frais de scolarité" : "Record tuition fee payments"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
          {/* ═══ LEFT COLUMN: Payment Form ═══ */}
          <div className="space-y-5">
            {/* Student search */}
            <div className="pm-fade bg-white rounded-xl border border-gray-200 p-5 shadow-sm" style={{ animationDelay: "0.02s" }}>
              <h3 className="text-sm font-bold text-gray-800 mb-3">
                {isFr ? "Rechercher un élève" : "Search Student"}
              </h3>
              <div className="relative">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder={isFr ? "Nom de l'élève..." : "Student name..."}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
                />
                {selectedStudent && (
                  <button
                    onClick={clearStudent}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <FiXCircle size={16} />
                  </button>
                )}
              </div>

              {/* Student suggestions */}
              {students.length > 0 && !selectedStudent && (
                <div className="mt-2 border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectStudent(s)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: hexToRgba(pc, 0.1), color: pc }}>
                        {initials(s.fullName || `${s.firstName || ""} ${s.lastName || ""}`)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">{s.fullName || `${s.firstName || ""} ${s.lastName || ""}`}</div>
                        <div className="text-xs text-gray-400">{s.className || s.classLabel || s.studentNumber || ""}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected student fee info */}
            {selectedStudent && (
              <div className="pm-fade space-y-4" style={{ animationDelay: "0.04s" }}>
                {/* Student info card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: hexToRgba(pc, 0.1), color: pc }}>
                      {initials(selectedStudent.fullName || `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{selectedStudent.fullName || `${selectedStudent.firstName || ""} ${selectedStudent.lastName || ""}`}</div>
                      <div className="text-xs text-gray-400">{selectedStudent.className || selectedStudent.classLabel || ""}</div>
                    </div>
                  </div>

                  {/* Fee summary */}
                  {feeSummary && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-3 rounded-lg bg-blue-50">
                        <div className="text-[18px] font-extrabold text-blue-600">{formatCurrency(totalDue)}</div>
                        <div className="text-[10px] text-blue-500 font-medium uppercase tracking-wider mt-0.5">{isFr ? "Total dû" : "Total Due"}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-green-50">
                        <div className="text-[18px] font-extrabold text-green-600">{formatCurrency(totalPaid)}</div>
                        <div className="text-[10px] text-green-500 font-medium uppercase tracking-wider mt-0.5">{isFr ? "Payé" : "Paid"}</div>
                      </div>
                      <div className="text-center p-3 rounded-lg" style={{ background: hexToRgba(balance > 0 ? "#F59E0B" : pc, 0.1) }}>
                        <div className="text-[18px] font-extrabold" style={{ color: balance > 0 ? "#F59E0B" : pc }}>{formatCurrency(balance)}</div>
                        <div className="text-[10px] font-medium uppercase tracking-wider mt-0.5" style={{ color: balance > 0 ? "#F59E0B" : pc }}>{isFr ? "Restant" : "Balance"}</div>
                      </div>
                    </div>
                  )}

                  {/* Progress bar */}
                  {totalDue > 0 && (
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(paidPct, 100)}%`, background: paidPct >= 100 ? pc : "#F59E0B" }} />
                    </div>
                  )}
                </div>

                {/* Payment form */}
                <form onSubmit={handleRecordPayment} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-800 mb-4">
                    {isFr ? "Détails du paiement" : "Payment Details"}
                  </h3>

                  <div className="space-y-4">
                    {/* Fee selection */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        {isFr ? "Frais à payer *" : "Fee to pay *"}
                      </label>
                      <select
                        value={feeId}
                        onChange={(e) => setFeeId(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 outline-none text-sm appearance-none bg-white cursor-pointer"
                      >
                        <option value="">{isFr ? "Sélectionner un frais..." : "Select a fee..."}</option>
                        {allFees.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} — {Number(f.amount).toLocaleString("en")} FCFA
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Amount */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        {isFr ? "Montant *" : "Amount *"}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
                          placeholder={isFr ? "Ex: 50000" : "E.g. 50000"}
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">FCFA</span>
                      </div>
                    </div>

                    {/* Payment method */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        {isFr ? "Méthode de paiement *" : "Payment Method *"}
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PAYMENT_METHODS.map((pm) => {
                          const isActive = method === pm.value;
                          return (
                            <button
                              key={pm.value}
                              type="button"
                              onClick={() => setMethod(pm.value)}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                isActive
                                  ? "border-teal-700 text-teal-700"
                                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                              }`}
                              style={isActive ? { background: hexToRgba(pc, 0.06), borderColor: pc, color: pc } : {}}
                            >
                              <FiCreditCard size={14} />
                              {pm.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Reference (optional) */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        {isFr ? "Référence (optionnel)" : "Reference (optional)"}
                      </label>
                      <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-100 outline-none text-sm"
                        placeholder={isFr ? "N° de reçu ou transaction..." : "Receipt or transaction number..."}
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={submitting || !selectedStudent || !feeId || !amount}
                      className="w-full h-12 rounded-xl text-white text-sm font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: pc }}
                    >
                      {submitting ? (
                        <FiRefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <FiCheck className="w-4 h-4" />
                      )}
                      {submitting
                        ? (isFr ? "Enregistrement..." : "Recording...")
                        : (isFr
                            ? `Enregistrer le paiement${amount ? ` (${Number(amount).toLocaleString("en")} FCFA)` : ""}`
                            : `Record Payment${amount ? ` (${Number(amount).toLocaleString("en")} FCFA)` : ""}`)}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* No student selected */}
            {!selectedStudent && (
              <div className="pm-fade flex flex-col items-center justify-center py-12 text-center" style={{ animationDelay: "0.04s" }}>
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 border-2 border-dashed border-gray-200">
                  <FiUser className="w-7 h-7 text-gray-300" />
                </div>
                <h3 className="text-base font-semibold text-gray-700 mb-1">
                  {isFr ? "Recherchez un élève" : "Search for a student"}
                </h3>
                <p className="text-sm text-gray-400 max-w-xs">
                  {isFr
                    ? "Tapez le nom d'un élève pour commencer à enregistrer un paiement."
                    : "Type a student's name to start recording a payment."}
                </p>
              </div>
            )}
          </div>

          {/* ═══ RIGHT COLUMN: Recent Payments ═══ */}
          <div className="space-y-4">
            <div className="pm-fade bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ animationDelay: "0.03s" }}>
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
                <FiClock className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-bold text-gray-800">
                  {isFr ? "Derniers paiements" : "Recent Payments"}
                </h3>
                <span className="text-xs text-gray-400 ml-auto">{recentPayments.length > 0 ? `${recentPayments.length} ${isFr ? "paiements" : "payments"}` : ""}</span>
              </div>

              {recentPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FiDollarSign className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">
                    {isFr ? "Aucun paiement récent" : "No recent payments"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {recentPayments.slice(0, 8).map((pmt, idx) => {
                    const pmtStatus = pmt.status || "completed";
                    const statusIcon = pmtStatus === "completed" ? FiCheckCircle : pmtStatus === "pending" ? FiClock : FiAlertCircle;
                    const statusColor = pmtStatus === "completed" ? "#1D9E75" : pmtStatus === "pending" ? "#F59E0B" : "#EF4444";
                    return (
                      <div key={pmt.id || idx} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: hexToRgba(statusColor, 0.1) }}>
                          <statusIcon size={16} style={{ color: statusColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-semibold text-gray-800 truncate">
                            {pmt.studentName || (isFr ? "Élève" : "Student")}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            {pmt.method || "Cash"}
                            {pmt.createdAt ? ` · ${new Date(pmt.createdAt).toLocaleDateString(isFr ? "fr-FR" : "en-US", { day: "numeric", month: "short" })}` : ""}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[14px] font-extrabold" style={{ color: pc }}>
                            +{Number(pmt.amount || 0).toLocaleString("en")} FCFA
                          </div>
                          <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: statusColor }}>
                            {pmtStatus === "completed" ? (isFr ? "Payé" : "Paid") : pmtStatus === "pending" ? (isFr ? "En attente" : "Pending") : (isFr ? "Échoué" : "Failed")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment summary */}
            {recentPayments.length > 0 && (
              <div className="pm-fade bg-white rounded-xl border border-gray-200 p-5 shadow-sm" style={{ animationDelay: "0.04s" }}>
                <div className="flex items-center gap-2.5 text-sm font-bold text-gray-800 mb-3">
                  <FiPrinter className="w-4 h-4 text-gray-400" />
                  {isFr ? "Aujourd'hui" : "Today"}
                </div>
                <div className="text-2xl font-extrabold" style={{ color: pc }}>
                  +{recentPayments
                    .filter(p => {
                      if (!p.createdAt) return false;
                      const today = new Date().toISOString().split("T")[0];
                      return p.createdAt.startsWith(today);
                    })
                    .reduce((s, p) => s + Number(p.amount || 0), 0)
                    .toLocaleString("en")} FCFA
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {recentPayments.filter(p => p.createdAt?.startsWith(new Date().toISOString().split("T")[0])).length} {isFr ? "paiement(s) aujourd'hui" : "payment(s) today"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
