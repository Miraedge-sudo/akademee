import { WifiOff, RefreshCw, Database } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useOffline } from "../../core/offline/OfflineContext";

export default function OfflineFallback() {
  const { isOnline: ctxOnline, wasOffline, lastOnlineAt } = useOffline();
  const [showCacheInfo, setShowCacheInfo] = useState(false);
  const [cacheSizes, setCacheSizes] = useState({});

  // Quand la connexion revient, recharger automatiquement
  useEffect(() => {
    if (wasOffline && ctxOnline) {
      const t = setTimeout(() => window.location.reload(), 1500);
      return () => clearTimeout(t);
    }
  }, [ctxOnline, wasOffline]);

  // Calculer la taille du cache pour l'affichage
  const loadCacheSizes = async () => {
    try {
      const { default: db } = await import("../../core/offline/db");
      const tables = db.tables;
      const sizes = {};
      for (const table of tables) {
        if (table.name === "syncMeta") continue;
        const count = await table.count();
        if (count > 0) sizes[table.name] = count;
      }
      setCacheSizes(sizes);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (showCacheInfo) loadCacheSizes();
  }, [showCacheInfo]);

  const totalCached = useMemo(
    () => Object.values(cacheSizes).reduce((a, b) => a + b, 0),
    [cacheSizes]
  );

  // ── État connecté → page de transition ──
  if (ctxOnline && !wasOffline) return null;

  if (ctxOnline && wasOffline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
          </div>
          <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100">
            Connexion rétablie
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Rechargement en cours…
          </p>
        </div>
      </div>
    );
  }

  // ── État hors ligne ──
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
      <div className="text-center p-8 max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-surface-100 mb-2">
          Vous êtes hors ligne
        </h1>
        <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed mb-6">
          Une connexion Internet est nécessaire pour accéder à toutes les
          fonctionnalités d'Akademee. Les données déjà synchronisées restent
          accessibles hors ligne.
        </p>

        {/* Info cache */}
        <button
          onClick={() => setShowCacheInfo((v) => !v)}
          className="inline-flex items-center gap-2 text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 mb-6 transition-colors"
        >
          <Database className="w-3.5 h-3.5" />
          {showCacheInfo
            ? "Masquer les données en cache"
            : "Voir les données disponibles hors ligne"}
        </button>

        {showCacheInfo && (
          <div className="bg-surface-100 dark:bg-surface-800/50 rounded-xl p-4 mb-6 text-left text-sm">
            <div className="flex items-center gap-2 text-surface-600 dark:text-surface-300 font-medium mb-2">
              <Database className="w-4 h-4" />
              Données en cache ({totalCached} éléments)
            </div>
            {Object.keys(cacheSizes).length === 0 ? (
              <p className="text-surface-400 text-xs">
                Aucune donnée en cache pour le moment. Les données seront
                mises en cache lors de la prochaine connexion.
              </p>
            ) : (
              <ul className="space-y-1 text-xs text-surface-500 dark:text-surface-400">
                {Object.entries(cacheSizes).map(([table, count]) => (
                  <li key={table} className="flex items-center justify-between">
                    <span className="capitalize">
                      {table === "sequences"
                        ? "Séquences"
                        : table === "students"
                          ? "Élèves"
                          : table === "classes"
                            ? "Classes"
                            : table === "subjects"
                              ? "Matières"
                              : table === "periods"
                                ? "Périodes"
                                : table}
                    </span>
                    <span className="font-mono text-surface-400">
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#085041] hover:bg-[#0a6b58] text-white font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.97]"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  );
}
