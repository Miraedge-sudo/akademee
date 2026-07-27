/**
 * SequencePerformance — Visualizes grade progression across sequences.
 *
 * ARCHITECTURE (v3 - corrigé) :
 *  - Tente plusieurs APIs avec fallback :
 *    1. getStudentSequenceAverages (nouvel endpoint dédié, le plus rapide)
 *    2. listReportCards (endpoint existant, routes sécurisées pour student)
 *  - Corrige le bug de chargement infini : 
 *    → PLUS de `data` dans les dépendances useEffect (évite le re-render loop)
 *    → Chaque appel est indépendant avec son propre cancel token
 *  - Affiche immédiatement un état (loading, error, empty ou chart)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, Loader2, RefreshCw } from 'lucide-react';
import { getStudentSequenceAverages } from '../../../core/api/gradeCalculationService';
import { listReportCards } from '../../../core/api/reportCardsService';

const COLORS = ['#085041', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444', '#14B8A6'];

export default function SequencePerformance({ studentId }) {
  const [state, setState] = useState({
    loading: true,
    data: [],
    error: null,
  });
  // Trigger pour forcer le re-fetch (bouton réessayer)
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const mountedRef = useRef(true);

  useEffect(() => {
    if (!studentId) {
      setState({ loading: false, data: [], error: null });
      return;
    }

    const abort = new AbortController();
    let cancelled = false;

    setState(prev => ({ ...prev, loading: true, error: null }));

    async function fetchData() {
      // Stratégie 1 : nouvel endpoint dédié (grades -> sequence_id)
      try {
        const result = await getStudentSequenceAverages(studentId);
        if (cancelled) return;

        const items = Array.isArray(result) ? result : [];
        if (items.length > 0) {
          const mapped = items.map((item, i) => ({
            seq: item.sequenceLabel || `Seq ${i + 1}`,
            avg: Number(item.average) || 0,
            color: item.color || COLORS[i % COLORS.length],
          }));
          setState({ loading: false, data: mapped, error: null });
          return;
        }
      } catch (e) {
        if (cancelled) return;
        // Erreur silencieuse — on tente le fallback
      }

      // Stratégie 2 (fallback) : listReportCards
      try {
        const cards = await listReportCards({ studentId });
        if (cancelled) return;

        const cardsArr = Array.isArray(cards) ? cards : cards?.reportCards || [];
        const seqCards = cardsArr.filter(rc => rc.sequence_id);

        if (seqCards.length > 0) {
          const mapped = seqCards.map((rc, i) => ({
            seq: rc.sequence_label || rc.period_name || `Seq ${i + 1}`,
            avg: Number(rc.general_average) || 0,
            color: COLORS[i % COLORS.length],
          }));
          setState({ loading: false, data: mapped, error: null });
          return;
        }

        setState({ loading: false, data: [], error: null });
      } catch (e) {
        if (cancelled) return;
        const status = e?.response?.status;
        if (status === 403) {
          setState({ loading: false, data: [], error: 'forbidden' });
        } else if (status === 404) {
          setState({ loading: false, data: [], error: 'empty' });
        } else {
          setState({ loading: false, data: [], error: 'error' });
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
      abort.abort();
    };
  }, [studentId, fetchTrigger]); // ← fetchTrigger permet au bouton Réessayer de fonctionner

  // Nettoyage au démontage
  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // ── Retry handler ──
  const handleRetry = useCallback(() => {
    setFetchTrigger(prev => prev + 1);
  }, []);

  // ── Loading state ──
  if (state.loading) {
    return (
      <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Performance by sequence
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="text-surface-300 animate-spin" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (state.error && state.error !== 'empty') {
    return (
      <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Performance by sequence
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <TrendingUp size={28} className="text-surface-200 dark:text-surface-600 mb-3" />
          {state.error === 'forbidden' ? (
            <>
              <p className="text-sm font-semibold text-amber-600">Accès restreint</p>
              <p className="text-xs text-surface-400 mt-1">Contactez l'administration pour accéder aux performances.</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-red-500">Erreur de chargement</p>
              <p className="text-xs text-surface-400 mt-1 mb-4">Impossible de récupérer les données de performance.</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                <RefreshCw size={12} />
                Réessayer
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Empty state (no data) ──
  if (state.data.length === 0) {
    return (
      <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Performance by sequence
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
          <TrendingUp size={28} className="text-surface-200 dark:text-surface-600 mb-3" />
          <p className="text-sm text-surface-400">Aucune note enregistrée</p>
          <p className="text-xs text-surface-300 mt-1">Les performances apparaîtront ici une fois les notes saisies.</p>
        </div>
      </div>
    );
  }

  // ── Chart ──
  const maxAvg = Math.max(...state.data.map(s => s.avg), 20);
  const yLabels = [0, 5, 10, 15, 20].filter(v => v <= Math.ceil(maxAvg));

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          Performance by sequence
        </div>
        <span className="text-xs text-surface-400">{new Date().getFullYear() - 1}/{new Date().getFullYear()}</span>
      </div>

      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0 flex flex-col-reverse justify-between pointer-events-none">
          {yLabels.map(v => (
            <div key={v} className="flex items-center gap-1.5">
              <span className="text-[10px] text-surface-300 w-5 text-right">{v}</span>
              <div
                className="flex-1 border-t border-dashed"
                style={{
                  borderColor: v === 10 ? '#fca5a5' : '#e5e7eb',
                  borderWidth: v === 10 ? '1.5px' : '1px',
                }}
              />
            </div>
          ))}
        </div>

        <div className="relative z-10 flex items-end gap-2.5 h-full pt-5 pb-1 ml-7">
          {state.data.map((s, i) => {
            const pct = Math.max((s.avg / maxAvg) * 100, 4);
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full group">
                <div className="text-[10.5px] font-bold text-surface-700 dark:text-surface-200 mt-auto mb-0.5">
                  {s.avg.toFixed(1)}
                </div>
                <div className="relative w-full flex-1 flex flex-col justify-end">
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface-900 dark:bg-surface-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none z-10 shadow-lg">
                    {s.avg.toFixed(1)}/20
                  </div>
                  <div
                    className="w-full rounded-t-[6px] transition-all duration-300 cursor-pointer hover:brightness-110 origin-bottom"
                    style={{
                      height: `${pct}%`,
                      background: s.color,
                      minHeight: '4px',
                      animation: `barGrow 0.6s cubic-bezier(.16,1,.3,1) ${i * 0.1}s both`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2.5 mt-3 pt-2 border-t border-surface-100 dark:border-surface-700">
        {state.data.map((s, i) => (
          <div key={i} className="flex-1 text-center text-[10px] font-semibold text-surface-400 truncate">
            {s.seq}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes barGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      `}</style>
    </div>
  );
}
