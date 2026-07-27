import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import useNetworkStatus from "./useNetworkStatus";
import { networkFirst, getLastSync, clearCache } from "./offlineCache";
import { processQueue, getPendingCount, getQueueSummary, clearQueue, addToQueue } from "./syncQueue";
import { useAuth } from "../hooks/useAuth";
import db from "./db";

// ── API services (imports dynamiques évités, import direct) ──
import { getStudents } from "../api/studentService";
import { getClasses } from "../api/classService";
import { getSubjects } from "../api/subjectService";
import { periodService } from "../api/periodService";
import { sequencesService } from "../api/sequencesService";

const OfflineContext = createContext(null);

/**
 * OfflineProvider — englobe l'application et fournit :
 *  - isOnline, wasOffline, lastOnlineAt
 *  - refreshCache(table) → force la synchro d'une table
 *  - getCachedData(table) → lit le cache IndexedDB
 *  - clearCache() → vide tout
 *  - syncQueue : { pendingCount, isProcessing, processNow, addToQueue, getSummary, clearFailed }
 */
export function OfflineProvider({ children }) {
  const network = useNetworkStatus();
  const { isAuthenticated } = useAuth();
  const [syncingTables, setSyncingTables] = useState(new Set());
  const [syncErrors, setSyncErrors] = useState({});

  // ── Sync Queue state ──
  const [queuePendingCount, setQueuePendingCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Rafraîchir le compteur de la file ──
  const refreshQueueCount = useCallback(async () => {
    const count = await getPendingCount();
    setQueuePendingCount(count);
  }, []);

  // ── Fonctions de fetch pour chaque table ──
  const fetchers = useMemo(
    () => ({
      students: () =>
        networkFirst({
          table: "students",
          fetchFn: () => getStudents(),
          mapFn: (raw) =>
            ensureArray(raw).map((s) => ({
              ...s,
              id: s.id || s.studentId,
            })),
        }),
      classes: () =>
        networkFirst({
          table: "classes",
          fetchFn: () => getClasses(),
          mapFn: (raw) => ensureArray(raw).map((c) => ({ id: c.id, ...c })),
        }),
      subjects: () =>
        networkFirst({
          table: "subjects",
          fetchFn: () => getSubjects(),
          mapFn: (raw) => ensureArray(raw).map((s) => ({ id: s.id, ...s })),
        }),
      periods: () =>
        networkFirst({
          table: "periods",
          fetchFn: () => periodService.list(),
          mapFn: (raw) => ensureArray(raw).map((p) => ({ id: p.id, ...p })),
        }),
      sequences: () =>
        networkFirst({
          table: "sequences",
          fetchFn: () => sequencesService.list(),
          mapFn: (raw) => ensureArray(raw).map((s) => ({ id: s.id, ...s })),
        }),
    }),
    []
  );

  // ── Rafraîchir une table spécifique ──
  const refreshCache = async (tableName) => {
    if (syncingTables.has(tableName)) return;
    setSyncingTables((prev) => new Set(prev).add(tableName));
    try {
      await fetchers[tableName]();
      setSyncErrors((prev) => ({ ...prev, [tableName]: null }));
    } catch (err) {
      console.warn(`[offline] Sync failed for "${tableName}":`, err);
      setSyncErrors((prev) => ({ ...prev, [tableName]: err.message }));
    } finally {
      setSyncingTables((prev) => {
        const next = new Set(prev);
        next.delete(tableName);
        return next;
      });
    }
  };

  // ── Traiter la file d'attente ──
  const processNow = useCallback(async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await processQueue({
        onProgress: () => refreshQueueCount(),
      });
    } finally {
      setIsProcessing(false);
      refreshQueueCount();
    }
  }, [isProcessing, refreshQueueCount]);

  // ── Synchro initiale : lancer le cache quand l'utilisateur est connecté et en ligne ──
  useEffect(() => {
    // Ne pas synchroniser si l'utilisateur n'est pas connecté (page login, etc.)
    if (!isAuthenticated || !network.isOnline) return;
    // Rafraîchir au montage
    const tables = ["students", "classes", "subjects", "periods", "sequences"];
    tables.forEach((t) => refreshCache(t));
    // Traiter la file d'attente pendante
    processNow();
    refreshQueueCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network.isOnline, isAuthenticated]);

  const value = useMemo(
    () => ({
      ...network,
      isSyncing: syncingTables.size > 0,
      syncingTables,
      syncErrors,
      refreshCache,
      getLastSync,
      clearCache,
      getCachedData: async (table) => {
        try {
          if (db[table]) return db[table].toArray();
          return [];
        } catch {
          return [];
        }
      },
      // Sync queue
      syncQueue: {
        pendingCount: queuePendingCount,
        isProcessing,
        processNow,
        addToQueue,
        getSummary: getQueueSummary,
        clearFailed: () => clearQueue(true),
        refreshCount: refreshQueueCount,
      },
    }),
    [network, syncingTables, syncErrors, queuePendingCount, isProcessing, processNow, refreshQueueCount]
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

/**
 * useOffline — hook pour accéder au contexte hors ligne
 */
export function useOffline() {
  const ctx = useContext(OfflineContext);
  if (!ctx) {
    throw new Error("useOffline must be used within an OfflineProvider");
  }
  return ctx;
}

// ── Helper (partagé avec offlineCache) ──
function ensureArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    if (data.data && Array.isArray(data.data)) return data.data;
    if (data.data && typeof data.data === "object") {
      for (const key of Object.keys(data.data)) {
        if (Array.isArray(data.data[key])) return data.data[key];
      }
    }
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) return data[key];
    }
  }
  return data ?? [];
}
