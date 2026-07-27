import { useState, useEffect } from "react";
import { Upload, RefreshCw, AlertCircle, X } from "lucide-react";
import { useOffline } from "../../core/offline/OfflineContext";

/**
 * SyncQueueIndicator — Badge flottant qui montre le nombre
 * d'opérations en attente de synchronisation.
 *
 * S'affiche uniquement quand il y a des opérations en attente
 * ou en cours de traitement.
 */
export default function SyncQueueIndicator() {
  // ── Keyframes pour l'animation d'entrée ──
  const ANIM_STYLES = `
    @keyframes sqFadeUp {
      from { opacity: 0; transform: translateY(12px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .sq-panel { animation: sqFadeUp 0.25s cubic-bezier(.16,1,.3,1) both; }
  `;
  const {
    isOnline,
    syncQueue: { pendingCount, isProcessing, processNow, getSummary, clearFailed },
  } = useOffline();

  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState(null);

  // Mettre à jour le résumé quand le compteur change
  useEffect(() => {
    if (expanded && pendingCount > 0) {
      getSummary().then(setSummary);
    }
  }, [expanded, pendingCount, getSummary]);

  // Cacher si rien en attente
  if (pendingCount === 0 && !isProcessing) return null;

  const handleProcess = async () => {
    await processNow();
  };

  const handleToggle = () => {
    setExpanded((v) => !v);
    if (!expanded) getSummary().then(setSummary);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999] flex flex-col items-end gap-2">
      <style>{ANIM_STYLES}</style>
      {/* Expanded panel */}
      {expanded && (
        <div className="sq-panel bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-100 dark:border-surface-700 p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Upload size={16} className="text-primary-600" />
              <span className="text-[13px] font-bold text-surface-900 dark:text-surface-100">
                Synchronisation
              </span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="w-6 h-6 rounded-md flex items-center justify-center text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Stats */}
          {summary && (
            <div className="space-y-2 mb-3">
              <div className="text-[12px] text-surface-500 dark:text-surface-400">
                <span className="font-semibold text-surface-700 dark:text-surface-200">{pendingCount}</span> opération{pendingCount > 1 ? "s" : ""} en attente
              </div>
              {Object.entries(summary.byType || {}).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-[11px]">
                  <span className="text-surface-500">
                    {type === "grade_create"
                      ? "Nouvelles notes"
                      : type === "grade_update"
                        ? "Modifications notes"
                        : type === "attendance_bulk"
                          ? "Présences"
                          : type}
                  </span>
                  <span className="font-mono text-surface-400">{count}</span>
                </div>
              ))}
              {summary.failed > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-red-500 pt-1 border-t border-surface-100 dark:border-surface-700">
                  <AlertCircle size={12} />
                  <span>{summary.failed} échec{summary.failed > 1 ? "s" : ""}</span>
                  <button
                    onClick={clearFailed}
                    className="ml-auto text-[10px] text-surface-400 hover:text-red-500 underline"
                  >
                    Effacer
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleProcess}
              disabled={!isOnline || isProcessing}
              className="flex-1 h-9 px-3 rounded-xl bg-[#085041] text-white text-[12px] font-semibold transition-all hover:bg-[#0a6b58] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Synchronisation...
                </>
              ) : (
                <>
                  <RefreshCw size={13} />
                  Synchroniser maintenant
                </>
              )}
            </button>
          </div>

          {!isOnline && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-500">
              <AlertCircle size={12} />
              En attente de connexion…
            </div>
          )}
        </div>
      )}

      {/* Floating badge */}
      <button
        onClick={handleToggle}
        className="relative flex items-center gap-2 h-11 px-4 bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-100 dark:border-surface-700 hover:shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-primary-400 border-t-primary-600 rounded-full animate-spin" />
        ) : (
          <Upload size={18} className="text-primary-600" />
        )}
        <span className="text-[13px] font-bold text-surface-900 dark:text-surface-100">
          {pendingCount}
        </span>
        {isProcessing && (
          <span className="text-[11px] text-surface-400 animate-pulse ml-1">
            Synchro…
          </span>
        )}
      </button>
    </div>
  );
}
