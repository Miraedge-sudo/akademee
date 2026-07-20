/**
 * MyFeesPage — Student fees overview page.
 *
 * Features:
 *  - Hero banner with student info
 *  - Fee status with progress ring
 *  - Fee breakdown (paid vs remaining)
 *  - Payment history list
 *
 * Route: /dashboard/my-fees
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import { useTheme } from '../../../core/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { getStudentMe } from '../../../core/api/studentService';
import { getStudentFeeSummary, getStudentFeeStatus } from '../../../core/api/feeCalculationService';
import FeeStatusWidget from '../components/FeeStatusWidget';
import {
  ArrowLeft,
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  CreditCard,
  CalendarDays,
} from 'lucide-react';

function getStatusConfig(status, pct) {
  if (status === 'paid' || pct >= 100) return { color: '#1D9E75', icon: CheckCircle2, label: 'Payé' };
  if (status === 'partial' || (pct > 0 && pct < 100)) return { color: '#F59E0B', icon: Clock, label: 'Partiel' };
  return { color: '#EF4444', icon: AlertTriangle, label: 'Impayé' };
}

export default function MyFeesPage() {
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const pc = primaryColor || '#085041';
  const isFr = i18n.language === 'fr';

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [feeDetails, setFeeDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const profile = await getStudentMe();
        setStudent(profile);
        const studentId = profile.id;

        const [summary, details] = await Promise.all([
          getStudentFeeSummary(studentId).catch(() => null),
          getStudentFeeStatus(studentId).catch(() => null),
        ]);

        setFeeSummary(summary);
        setFeeDetails(details);
      } catch (err) {
        console.error('Failed to load fees:', err);
        setError(isFr ? 'Échec du chargement' : 'Failed to load');
      }
      setLoading(false);
    }
    load();
  }, []);

  const totalDue = feeSummary?.totalDue || 0;
  const totalPaid = feeSummary?.totalPaid || 0;
  const feeStatus = feeSummary?.status || student?.feeStatus || 'pending';
  const paidPct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
  const remaining = Math.max(0, totalDue - totalPaid);
  const statusCfg = getStatusConfig(feeStatus, paidPct);

  // Payment items from feeDetails or build from summary
  const payments = feeDetails?.payments || feeDetails?.items || [];
  const feeItems = feeDetails?.fees || [];

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="h-64 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
          <div className="h-64 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
          <div className="h-64 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
        </div>
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
        .mf-fade { animation: mfFadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
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
            {isFr ? 'Retour au tableau de bord' : 'Back to dashboard'}
          </button>
          <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight mb-2">
            {isFr ? 'Mes Frais' : 'My Fees'}
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            {student?.fullName}{student?.className ? ` · ${student.className}` : ''}
          </p>
        </div>
      </div>

      {/* ── Status banner ── */}
      {totalDue > 0 && (
        <div
          className="mf-fade flex items-center gap-3 px-5 py-3.5 rounded-xl text-[13px] font-medium shadow-sm border"
          style={{
            background: `${statusCfg.color}08`,
            borderColor: `${statusCfg.color}20`,
            color: statusCfg.color,
            animationDelay: '0.06s',
          }}
        >
          <statusCfg.icon size={18} />
          <span>
            {isFr ? 'Statut des frais' : 'Fee status'}: <strong>
              {paidPct >= 100 ? (isFr ? 'Totalement payé' : 'Fully paid')
                : paidPct > 0 ? (isFr ? `Partiellement payé (${paidPct}%)` : `Partially paid (${paidPct}%)`)
                : (isFr ? 'Non payé' : 'Unpaid')}
            </strong>
            {' · '}
            {isFr ? 'Restant dû' : 'Remaining'}: <strong>{remaining.toLocaleString('en')} FCFA</strong>
          </span>
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="mf-fade grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ animationDelay: '0.08s' }}>
        {/* Fee Status Widget */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm">
          <FeeStatusWidget
            paid={totalPaid}
            total={totalDue}
            status={feeStatus}
          />
        </div>

        {/* Quick Stats */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm">
          <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
            {isFr ? 'Résumé financier' : 'Financial Summary'}
          </h3>
          <div className="space-y-4">
            {[
              { icon: Wallet, label: isFr ? 'Total dû' : 'Total Due', value: `${totalDue.toLocaleString('en')} FCFA`, color: '#3B82F6' },
              { icon: CheckCircle2, label: isFr ? 'Total payé' : 'Total Paid', value: `${totalPaid.toLocaleString('en')} FCFA`, color: '#1D9E75' },
              { icon: remaining > 0 ? Clock : CheckCircle2, label: isFr ? 'Restant' : 'Remaining', value: `${remaining.toLocaleString('en')} FCFA`, color: remaining > 0 ? '#F59E0B' : '#1D9E75' },
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
                <span>{isFr ? 'Date d\'échéance' : 'Due date'}: {new Date(feeSummary.dueDate).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Fee Items Breakdown */}
        <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-5 shadow-sm">
          <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
            {isFr ? 'Frais applicables' : 'Applicable Fees'}
          </h3>
          {feeItems.length > 0 ? (
            <div className="space-y-3">
              {feeItems.map((fee, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-surface-50 dark:border-surface-700/50 last:border-0">
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold text-surface-800 dark:text-surface-200">{fee.name || fee.label}</div>
                    {fee.description && <div className="text-[10px] text-surface-400">{fee.description}</div>}
                  </div>
                  <span className="text-[13px] font-extrabold text-surface-700 dark:text-surface-300">
                    {(fee.amount || 0).toLocaleString('en')} FCFA
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Receipt size={24} className="text-surface-200 dark:text-surface-600 mb-2" />
              <p className="text-[12px] text-surface-400">{isFr ? 'Aucun frais applicable' : 'No applicable fees'}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Payment History ── */}
      {payments.length > 0 && (
        <div className="mf-fade" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-surface-100 dark:border-surface-700">
              <CreditCard size={16} className="text-surface-400" />
              <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100">
                {isFr ? 'Historique des paiements' : 'Payment History'}
              </h3>
              <span className="text-[11px] text-surface-400 ml-auto">{payments.length} {isFr ? 'paiement(s)' : 'payment(s)'}</span>
            </div>
            <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
              {payments.map((pmt, idx) => {
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
                        {pmt.description || pmt.label || (isFr ? 'Paiement' : 'Payment')}
                      </div>
                      <div className="text-[11px] text-surface-400">
                        {pmt.date ? new Date(pmt.date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US') : ''}
                        {pmt.method ? ` · ${pmt.method}` : ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[14px] font-extrabold text-surface-800 dark:text-surface-100">
                        {(pmt.amount || 0).toLocaleString('en')} FCFA
                      </div>
                      <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: statusColor }}>
                        {pmtStatus === 'completed' ? (isFr ? 'Payé' : 'Paid')
                          : pmtStatus === 'pending' ? (isFr ? 'En attente' : 'Pending')
                          : (isFr ? 'Échoué' : 'Failed')}
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
      {totalDue === 0 && !loading && (
        <div className="mf-fade flex flex-col items-center justify-center py-16 text-center" style={{ animationDelay: '0.1s' }}>
          <div className="w-20 h-20 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-5 border-2 border-dashed border-surface-200 dark:border-surface-600">
            <Wallet size={32} className="text-surface-300" />
          </div>
          <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
            {isFr ? 'Aucun frais pour le moment' : 'No fees yet'}
          </h3>
          <p className="text-sm text-surface-400 max-w-sm">
            {isFr
              ? 'Les informations sur vos frais de scolarité apparaîtront ici une fois configurées.'
              : 'Your fee information will appear here once configured.'}
          </p>
        </div>
      )}
    </div>
  );
}
