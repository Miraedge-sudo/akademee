/**
 * MyFeesPage — Student fees overview with per-fee breakdown.
 *
 * Features:
 *  - Hero banner with student info
 *  - Global fee status (ring + summary)
 *  - Per-fee cards with individual progress bars & due dates
 *  - Payment history with status badges
 *  - Full i18n support via t()
 *
 * Route: /dashboard/my-fees
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import { useTheme } from '../../../core/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { getStudentMe, getStudentById } from '../../../core/api/studentService';
import { getStudentFeeSummary } from '../../../core/api/feeCalculationService';
import { getStudentFeeBreakdown } from '../../../core/api/feeCalculationService';
import FeeStatusWidget from '../components/FeeStatusWidget';
import {
  ArrowLeft,
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Receipt,
  CreditCard,
  CalendarDays,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function getFeeStatusColor(status) {
  switch (status) {
    case 'paid': return '#1D9E75';
    case 'partial': return '#F59E0B';
    case 'pending':
    case 'none':
    default: return '#EF4444';
  }
}

function getFeeStatusLabel(status, t) {
  switch (status) {
    case 'paid': return t('student.fees.paymentStatusPaid', 'Paid');
    case 'partial': return t('student.fees.partiallyPaid', 'Partially paid');
    case 'pending': return t('student.fees.paymentStatusPending', 'Pending');
    default: return t('student.fees.unpaid', 'Unpaid');
  }
}

function getFeeStatusIcon(status) {
  switch (status) {
    case 'paid': return CheckCircle2;
    case 'partial': return Clock;
    default: return AlertTriangle;
  }
}

function formatDate(dateStr, locale) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  try {
    return new Date(dueDate) < new Date();
  } catch {
    return false;
  }
}

export default function MyFeesPage() {
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pc = primaryColor || '#085041';
  const isFr = i18n.language === 'fr';

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [feeBreakdown, setFeeBreakdown] = useState([]);
  const [error, setError] = useState(null);
  const [expandedFee, setExpandedFee] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Support ?studentId= for parent viewing
        const urlStudentId = searchParams.get('studentId');
        let profile;
        if (urlStudentId) {
          profile = await getStudentById(urlStudentId);
        } else {
          profile = await getStudentMe();
        }
        setStudent(profile);
        const studentId = profile.id;

        const [summary, breakdown] = await Promise.all([
          getStudentFeeSummary(studentId).catch(() => null),
          getStudentFeeBreakdown(studentId).catch(() => []),
        ]);

        setFeeSummary(summary);
        setFeeBreakdown(Array.isArray(breakdown) ? breakdown : []);
      } catch (err) {
        console.error('Failed to load fees:', err);
        setError(t('student.fees.loadError', 'Failed to load'));
      }
      setLoading(false);
    }
    load();
  }, [t]);

  const totalDue = feeSummary?.totalDue || feeSummary?.totalFees || 0;
  const totalPaid = feeSummary?.totalPaid || 0;
  const feeStatus = feeSummary?.status || student?.feeStatus || 'pending';
  const paidPct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
  const balance = Math.max(0, totalDue - totalPaid);

  // Build per-fee stat cards from breakdown
  const paidFees = feeBreakdown.filter(f => f.status === 'paid').length;
  const partialFees = feeBreakdown.filter(f => f.status === 'partial').length;
  const pendingFees = feeBreakdown.filter(f => f.status !== 'paid' && f.status !== 'partial').length;

  // Payment history from summary
  const payments = feeSummary?.payments || [];

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-64 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
          <div className="h-64 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
          <div className="h-64 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
        </div>
        <div className="h-72 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-5">
      <style>{`
        @keyframes mfFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mfBarGrow {
          from { width: 0; }
          to   { width: var(--target-w); }
        }
        @keyframes mfRingFill {
          from { stroke-dashoffset: var(--full); }
          to   { stroke-dashoffset: var(--target); }
        }
        .mf-fade { animation: mfFadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
        .mf-bar  { animation: mfBarGrow 1.2s cubic-bezier(.16,1,.3,1) forwards; }
      `}</style>

      {/* ── Header ── */}
      <div
        className="mf-fade relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10">
          <button
            onClick={() => navigate('/dashboard/student-home')}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-[12px] font-medium mb-3 transition-colors"
          >
            <ArrowLeft size={14} />
            {t('student.fees.backToDashboard')}
          </button>
          <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight mb-2">
            {t('student.fees.title')}
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            {student?.fullName}{student?.className ? ` · ${student.className}` : ''}
          </p>
        </div>
      </div>

      {/* ── Status banner ── */}
      {totalDue > 0 && (
        <div
          className="mf-fade flex items-center gap-3 px-5 py-3.5 rounded-xl text-[13px] font-medium shadow-sm border flex-wrap"
          style={{
            background: `${getFeeStatusColor(feeStatus)}08`,
            borderColor: `${getFeeStatusColor(feeStatus)}20`,
            color: getFeeStatusColor(feeStatus),
            animationDelay: '0.05s',
          }}
        >
          {feeBreakdown.length > 0 ? (
            <>
              <strong>{t('student.fees.feeStatus')}:</strong>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#1D9E75]" />
                {paidFees} {t('student.fees.paymentStatusPaid').toLowerCase()}
              </span>
              {partialFees > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-[#F59E0B]" />
                  {partialFees} {t('student.fees.partiallyPaid').toLowerCase()}
                </span>
              )}
              {pendingFees > 0 && (
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-[#EF4444]" />
                  {pendingFees} {t('student.fees.unpaid').toLowerCase()}
                </span>
              )}
              <span className="mx-2 opacity-30">·</span>
              <span>
                {t('student.fees.remaining')}: <strong>{balance.toLocaleString('en')} FCFA</strong>
              </span>
            </>
          ) : (
            <>
              {t('student.fees.feeStatus')}: <strong>
                {paidPct >= 100
                  ? t('student.fees.fullyPaid')
                  : paidPct > 0
                    ? `${t('student.fees.partiallyPaid')} (${paidPct}%)`
                    : t('student.fees.unpaid')}
              </strong>
              {' · '}
              {t('student.fees.remaining')}: <strong>{balance.toLocaleString('en')} FCFA</strong>
            </>
          )}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="mf-fade grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ animationDelay: '0.06s' }}>
        {/* Global Fee Status Ring */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm">
          <FeeStatusWidget
            paid={totalPaid}
            total={totalDue}
            status={feeStatus}
            dueDate={feeSummary?.dueDate || null}
          />
        </div>

        {/* Financial Summary */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm">
          <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
            {t('student.fees.financialSummary')}
          </h3>
          <div className="space-y-4">
            {[
              { icon: Wallet, label: t('student.fees.totalDue'), value: `${totalDue.toLocaleString('en')} FCFA`, color: '#3B82F6' },
              { icon: CheckCircle2, label: t('student.fees.totalPaid'), value: `${totalPaid.toLocaleString('en')} FCFA`, color: '#1D9E75' },
              { icon: balance > 0 ? Clock : CheckCircle2, label: t('student.fees.remaining'), value: `${balance.toLocaleString('en')} FCFA`, color: balance > 0 ? '#F59E0B' : '#1D9E75' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-surface-50 dark:border-surface-700/50 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${item.color}12` }}>
                    <item.icon size={14} style={{ color: item.color }} />
                  </div>
                  <span className="text-[12px] text-surface-500">{item.label}</span>
                </div>
                <span className="text-[13px] font-bold" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
            {feeSummary?.dueDate && (
              <div className="flex items-center gap-2 pt-2 text-[12px] text-amber-600 dark:text-amber-500">
                <CalendarDays size={14} />
                <span>{t('student.fees.dueDate')}: {formatDate(feeSummary.dueDate, isFr)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats — Per-fee status count */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm">
          <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
            {t('student.fees.applicableFees')}
          </h3>
          {feeBreakdown.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-[#1D9E75]" />
                  <span className="text-[12px] text-emerald-700 dark:text-emerald-400 font-medium">{t('student.fees.paymentStatusPaid')}</span>
                </div>
                <span className="text-[16px] font-extrabold text-[#1D9E75]">{paidFees}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#F59E0B]" />
                  <span className="text-[12px] text-amber-700 dark:text-amber-400 font-medium">{t('student.fees.partiallyPaid')}</span>
                </div>
                <span className="text-[16px] font-extrabold text-[#F59E0B]">{partialFees}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-50/50 dark:bg-red-900/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-[#EF4444]" />
                  <span className="text-[12px] text-red-700 dark:text-red-400 font-medium">{t('student.fees.unpaid')}</span>
                </div>
                <span className="text-[16px] font-extrabold text-[#EF4444]">{pendingFees}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
                <div className="w-full h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                  {feeBreakdown.length > 0 && (
                    <div className="flex h-full">
                      {paidFees > 0 && (
                        <div className="h-full bg-[#1D9E75] transition-all" style={{ width: `${(paidFees / feeBreakdown.length) * 100}%` }} />
                      )}
                      {partialFees > 0 && (
                        <div className="h-full bg-[#F59E0B] transition-all" style={{ width: `${(partialFees / feeBreakdown.length) * 100}%` }} />
                      )}
                      {pendingFees > 0 && (
                        <div className="h-full bg-[#EF4444] transition-all" style={{ width: `${(pendingFees / feeBreakdown.length) * 100}%` }} />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-1.5 text-[10px] text-surface-400">
                  <span>{feeBreakdown.length} {t('student.fees.feeLabel', 'fee')}(s)</span>
                  <span>{paidPct}% {t('student.fees.paymentStatusPaid').toLowerCase()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Receipt size={24} className="text-surface-200 dark:text-surface-600 mb-2" />
              <p className="text-[12px] text-surface-400">{t('student.fees.noFeesApplicable')}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Per-Fee Breakdown Cards ── */}
      {feeBreakdown.length > 0 && (
        <div className="space-y-3">
          <div className="mf-fade flex items-center gap-2.5" style={{ animationDelay: '0.08s' }}>
            <Receipt size={16} className="text-surface-400" />
            <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100">
              {t('student.fees.applicableFees')}
            </h3>
            <span className="text-[11px] text-surface-400 ml-auto">{feeBreakdown.length} {t('student.fees.feeLabel', 'fee')}(s)</span>
          </div>

          {feeBreakdown.map((fee, idx) => {
            const feePct = fee.amountDue > 0 ? Math.round((fee.amountPaid / fee.amountDue) * 100) : 0;
            const feeStatusColor = getFeeStatusColor(fee.status);
            const StatusIcon = getFeeStatusIcon(fee.status);
            const overdue = isOverdue(fee.dueDate) && fee.status !== 'paid';
            const isExpanded = expandedFee === fee.id;

            // Find matching payments for this fee
            const feePayments = payments.filter(p => p.feeId === fee.feeId);
            const feeDueDate = fee.dueDate || null;

            return (
              <div
                key={fee.id}
                className="mf-fade bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md"
                style={{ animationDelay: `${0.09 + idx * 0.03}s` }}
              >
                {/* Fee Header */}
                <div
                  className="flex items-center gap-4 px-5 py-3.5 cursor-pointer select-none transition-colors hover:bg-surface-50/50 dark:hover:bg-surface-900/30"
                  onClick={() => setExpandedFee(isExpanded ? null : fee.id)}
                >
                  {/* Status indicator */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all`}
                    style={{ background: `${feeStatusColor}15` }}
                  >
                    <StatusIcon size={18} style={{ color: feeStatusColor }} />
                  </div>

                  {/* Fee info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold text-surface-900 dark:text-surface-100 truncate">
                        {fee.feeName}
                      </span>
                      {overdue && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          <AlertCircle size={10} />
                          {t('student.fees.overdue', 'Overdue')}
                        </span>
                      )}
                    </div>
                    {feeDueDate && (
                      <div className="text-[11px] text-surface-400 flex items-center gap-1 mt-0.5">
                        <CalendarDays size={11} />
                        {t('student.fees.dueDate')}: {formatDate(feeDueDate, isFr)}
                      </div>
                    )}
                  </div>

                  {/* Amount & Progress */}
                  <div className="hidden sm:block w-36">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-surface-400">{feePct}%</span>
                      <span className="text-[12px] font-bold text-surface-700 dark:text-surface-300">
                        {fee.amountPaid.toLocaleString('en')} / {fee.amountDue.toLocaleString('en')} FCFA
                      </span>
                    </div>
                    <div className="w-full h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full mf-bar transition-all"
                        style={{
                          width: `${Math.min(feePct, 100)}%`,
                          background: feeStatusColor,
                          '--target-w': `${Math.min(feePct, 100)}%`,
                        }}

                      />
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="hidden sm:block w-24 text-right">
                    <span
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: `${feeStatusColor}12`,
                        color: feeStatusColor,
                      }}
                    >
                      <StatusIcon size={12} />
                      {getFeeStatusLabel(fee.status, t)}
                    </span>
                  </div>

                  {/* Expand toggle */}
                  <div className="text-surface-300">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Mobile summary (visible on small screens only) */}
                <div className="sm:hidden px-5 pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-bold text-surface-700 dark:text-surface-300">
                      {fee.amountPaid.toLocaleString('en')} / {fee.amountDue.toLocaleString('en')} FCFA
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${feeStatusColor}12`,
                        color: feeStatusColor,
                      }}
                    >
                      <StatusIcon size={10} />
                      {getFeeStatusLabel(fee.status, t)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full mf-bar"
                      style={{
                        width: `${Math.min(feePct, 100)}%`,
                        background: feeStatusColor,
                        '--target-w': `${Math.min(feePct, 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mx-5 mb-4 px-4 py-3 rounded-lg bg-surface-50/50 dark:bg-surface-900/30 border border-surface-100 dark:border-surface-700/50">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div className="text-center p-2 rounded-lg bg-white dark:bg-surface-800">
                        <div className="text-[16px] font-extrabold text-surface-900 dark:text-surface-100">
                          {fee.amountDue.toLocaleString('en')}
                        </div>
                        <div className="text-[9px] text-surface-400 uppercase tracking-wider font-semibold mt-0.5">
                          {t('student.fees.totalDue')}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white dark:bg-surface-800">
                        <div className="text-[16px] font-extrabold text-[#1D9E75]">
                          {fee.amountPaid.toLocaleString('en')}
                        </div>
                        <div className="text-[9px] text-surface-400 uppercase tracking-wider font-semibold mt-0.5">
                          {t('student.fees.totalPaid')}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white dark:bg-surface-800">
                        <div className="text-[16px] font-extrabold" style={{ color: feeStatusColor }}>
                          {Math.max(0, fee.amountDue - fee.amountPaid).toLocaleString('en')}
                        </div>
                        <div className="text-[9px] text-surface-400 uppercase tracking-wider font-semibold mt-0.5">
                          {t('student.fees.remaining')}
                        </div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white dark:bg-surface-800">
                        <div className="text-[16px] font-extrabold" style={{ color: feeStatusColor }}>
                          {feePct}%
                        </div>
                        <div className="text-[9px] text-surface-400 uppercase tracking-wider font-semibold mt-0.5">
                          {t('student.attendance.rate', 'Rate')}
                        </div>
                      </div>
                    </div>

                    {/* Related payments */}
                    {feePayments.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider mb-2">
                          {t('student.fees.paymentHistory')}
                        </div>
                        <div className="space-y-1.5">
                          {feePayments.map((pmt, pidx) => (
                            <div key={pmt.id || pidx} className="flex items-center justify-between text-[12px] py-1.5 px-2 rounded-md bg-white dark:bg-surface-800">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: pmt.status === 'completed' ? '#1D9E7515' : '#F59E0B15' }}>
                                  {pmt.status === 'completed' ? (
                                    <CheckCircle2 size={11} className="text-[#1D9E75]" />
                                  ) : (
                                    <Clock size={11} className="text-[#F59E0B]" />
                                  )}
                                </div>
                                <span className="text-surface-600 dark:text-surface-400">
                                  {pmt.date ? formatDate(pmt.date, isFr) : ''}
                                </span>
                                {pmt.method && (
                                  <span className="text-surface-400 text-[10px]">({pmt.method})</span>
                                )}
                              </div>
                              <span className="font-bold text-surface-800 dark:text-surface-200">
                                {pmt.amount.toLocaleString('en')} FCFA
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {feePayments.length === 0 && fee.amountPaid === 0 && (
                      <div className="text-center py-3">
                        <p className="text-[11px] text-surface-400">
                          {t('student.fees.noPaymentsForFee', 'No payments made for this fee.')}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Payment History ── */}
      {payments.length > 0 && (
        <div className="mf-fade" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-surface-100 dark:border-surface-700">
              <CreditCard size={16} className="text-surface-400" />
              <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100">
                {t('student.fees.paymentHistory')}
              </h3>
              <span className="text-[11px] text-surface-400 ml-auto">{payments.length} {t('student.fees.paymentLabel', 'payment')}(s)</span>
            </div>
            <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
              {payments.slice(0, 10).map((pmt, idx) => {
                const pmtStatus = pmt.status || 'completed';
                const statusColor = pmtStatus === 'completed' ? '#1D9E75' : pmtStatus === 'pending' ? '#F59E0B' : '#EF4444';
                return (
                  <div key={pmt.id || idx} className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-50 dark:hover:bg-surface-900/30 transition-colors">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${statusColor}12` }}
                    >
                      {pmtStatus === 'completed' ? <CheckCircle2 size={16} style={{ color: statusColor }} />
                        : pmtStatus === 'pending' ? <Clock size={16} style={{ color: statusColor }} />
                        : <AlertTriangle size={16} style={{ color: statusColor }} />}
                    </div>
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold text-surface-800 dark:text-surface-200">
                        {pmt.description || pmt.label || t('student.fees.payment')}
                      </div>
                      <div className="text-[11px] text-surface-400">
                        {pmt.date ? formatDate(pmt.date, isFr) : ''}
                        {pmt.method ? ` · ${pmt.method}` : ''}
                        {pmt.receiptNumber ? ` · #${pmt.receiptNumber}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-extrabold text-surface-800 dark:text-surface-100">
                        {(pmt.amount || 0).toLocaleString('en')} FCFA
                      </div>
                      <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: statusColor }}>
                        {pmtStatus === 'completed'
                          ? t('student.fees.paymentStatusPaid')
                          : pmtStatus === 'pending'
                            ? t('student.fees.paymentStatusPending')
                            : t('student.fees.paymentStatusFailed')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {totalDue === 0 && feeBreakdown.length === 0 && !loading && (
        <div className="mf-fade flex flex-col items-center justify-center py-16 text-center" style={{ animationDelay: '0.1s' }}>
          <div className="w-20 h-20 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-5 border-2 border-dashed border-surface-200 dark:border-surface-600">
            <Wallet size={32} className="text-surface-300" />
          </div>
          <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
            {t('student.fees.noFees')}
          </h3>
          <p className="text-sm text-surface-400 max-w-sm">
            {t('student.fees.noFeesDesc')}
          </p>
        </div>
      )}
    </div>
  );
}
