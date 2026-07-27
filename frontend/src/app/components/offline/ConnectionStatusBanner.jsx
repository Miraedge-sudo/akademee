import { WifiOff, Upload, RefreshCw, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useOffline } from "../../core/offline/OfflineContext";

/**
 * ConnectionStatusBanner — Bannière persistante en haut de l'écran
 * qui indique l'état de la connexion et de la synchronisation.
 *
 * États :
 *  - 🔴 Hors ligne : fond rouge
 *  - 🟡 Synchro en cours : fond ambre
 *  - 🔵 Files en attente : fond bleu (visible seulement si connexion OK)
 *  - Masqué quand tout va bien
 */
export default function ConnectionStatusBanner() {
  const { isOnline, isSyncing, syncQueue: { pendingCount, processNow } } = useOffline();
  const [dismissed, setDismissed] = useState(false);

  // Réinitialiser "dismissed" si l'état critique change
  // pour que la bannière réapparaisse si besoin
  useEffect(() => {
    setDismissed(false);
  }, [isOnline, pendingCount, isSyncing]);

  // Déterminer l'état prioritaire
  const isOffline = !isOnline;
  const hasPending = pendingCount > 0;

  // Masqué si tout va bien
  if ((isOnline && !isSyncing && !hasPending) || dismissed) return null;

  // ── État OFFLINE ──
  if (isOffline) {
    return (
      <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5 border-b bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 transition-all duration-300">
        <WifiOff size={15} className="text-red-500 flex-shrink-0" />
        <p className="text-[12px] leading-relaxed flex-1 text-red-700 dark:text-red-300">
          Vous êtes hors ligne. Les données affichées sont celles du cache.
          Les modifications seront synchronisées automatiquement au retour de la connexion.
          {hasPending && (
            <strong className="ml-1">({pendingCount} opération{pendingCount > 1 ? "s" : ""} en attente)</strong>
          )}
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-white/50 dark:hover:bg-red-950/60 transition-colors flex-shrink-0"
          title="Fermer"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // ── État SYNCING ──
  if (isSyncing) {
    return (
      <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5 border-b bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 transition-all duration-300">
        <div className="w-[15px] h-[15px] border-2 border-amber-400 border-t-amber-600 rounded-full animate-spin flex-shrink-0" />
        <p className="text-[12px] leading-relaxed flex-1 text-amber-700 dark:text-amber-300">
          Synchronisation des données en cours…
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-amber-400 hover:text-amber-600 hover:bg-white/50 dark:hover:bg-amber-950/60 transition-colors flex-shrink-0"
          title="Fermer"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // ── État PENDING (opérations en attente, en ligne) ──
  if (hasPending && isOnline) {
    return (
      <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5 border-b bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 transition-all duration-300">
        <Upload size={15} className="text-blue-500 flex-shrink-0" />
        <p className="text-[12px] leading-relaxed flex-1 text-blue-700 dark:text-blue-300">
          <strong>{pendingCount}</strong> opération{pendingCount > 1 ? "s" : ""} en attente de synchronisation.
        </p>
        <button
          onClick={processNow}
          className="flex items-center gap-1.5 px-3 h-7 rounded-lg bg-white dark:bg-surface-800 text-[11px] font-semibold text-surface-700 dark:text-surface-200 border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors shadow-sm"
        >
          <RefreshCw size={12} />
          Synchroniser
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="w-6 h-6 rounded-md flex items-center justify-center text-blue-400 hover:text-blue-600 hover:bg-white/50 dark:hover:bg-blue-950/60 transition-colors flex-shrink-0"
          title="Fermer"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return null;
}
