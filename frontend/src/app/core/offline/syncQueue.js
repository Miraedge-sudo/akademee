import db from "./db";
import { recordGrade, updateGrade } from "../api/gradeService";
import { recordBulkAttendance } from "../api/attendanceService";

// ── Opérations supportées ──
const OPERATIONS = {
  GRADE_CREATE: "grade_create",
  GRADE_UPDATE: "grade_update",
  ATTENDANCE_BULK: "attendance_bulk",
};

// ── Types d'erreurs ──
const ERROR_TYPES = {
  NETWORK: "network",
  CONFLICT: "conflict",
  VALIDATION: "validation",
  UNKNOWN: "unknown",
};

/**
 * Analyse une erreur pour déterminer si on peut réessayer
 */
function classifyError(err) {
  if (!err) return ERROR_TYPES.UNKNOWN;
  // Erreur réseau (pas de réponse, timeout, etc.)
  if (
    err.code === "ERR_NETWORK" ||
    err.code === "ECONNABORTED" ||
    err.message?.includes("Network Error") ||
    err.message?.includes("timeout") ||
    err.message?.includes("Failed to fetch")
  ) {
    return ERROR_TYPES.NETWORK;
  }
  const status = err.response?.status;
  if (status === 409) return ERROR_TYPES.CONFLICT;
  if (status === 422 || status === 400) return ERROR_TYPES.VALIDATION;
  if (status >= 500) return ERROR_TYPES.NETWORK;
  return ERROR_TYPES.UNKNOWN;
}

/**
 * Ajoute une opération à la file d'attente
 *
 * @param {'grade_create'|'grade_update'|'attendance_bulk'} type
 * @param {object} payload - Données nécessaires pour rejouer l'opération
 * @returns {Promise<number>} ID de l'entrée dans la file
 */
export async function addToQueue(type, payload) {
  const entry = {
    type,
    payload,
    status: "pending",
    createdAt: Date.now(),
    retryCount: 0,
    error: null,
  };
  const id = await db.syncQueue.add(entry);
  console.info(`[syncQueue] Added ${type} (id: ${id}) — queue size will increase`);
  return id;
}

/**
 * Traite toutes les opérations en attente dans la file
 * Appelée automatiquement quand la connexion revient
 *
 * @param {object} options
 * @param {(progress: object) => void} [options.onProgress] - Callback de progression
 * @param {boolean} [options.dryRun] - Si true, ne fait que lister sans exécuter
 * @returns {Promise<{synced: number, failed: number, errors: string[]}>}
 */
export async function processQueue(options = {}) {
  const { onProgress, dryRun } = options;
  const pending = await db.syncQueue
    .where("status")
    .anyOf("pending", "failed")
    .toArray();

  if (pending.length === 0) return { synced: 0, failed: 0, errors: [] };

  let synced = 0;
  let failed = 0;
  const errors = [];

  for (const item of pending) {
    if (dryRun) {
      console.info(`[syncQueue] Would process ${item.type} #${item.id}`);
      continue;
    }

    // Marquer comme en cours
    await db.syncQueue.update(item.id, { status: "syncing" });

    try {
      await executeOperation(item.type, item.payload);

      // Succès → supprimer de la file
      await db.syncQueue.delete(item.id);
      synced++;
      console.info(`[syncQueue] ✅ ${item.type} #${item.id} synced`);

      if (onProgress) {
        onProgress({ type: item.type, id: item.id, status: "synced", synced, failed, total: pending.length });
      }
    } catch (err) {
      const errorType = classifyError(err);
      const errorMsg = err?.response?.data?.message || err?.message || "Erreur inconnue";

      if (errorType === ERROR_TYPES.NETWORK) {
        // Erreur réseau → réessayer plus tard
        const newRetry = item.retryCount + 1;
        await db.syncQueue.update(item.id, {
          status: "failed",
          retryCount: newRetry,
          error: errorMsg,
        });
        failed++;
        errors.push(`[${item.type}] ${errorMsg}`);

        if (onProgress) {
          onProgress({ type: item.type, id: item.id, status: "failed", error: errorMsg, synced, failed, total: pending.length });
        }

        // Si on a une erreur réseau, on arrête le traitement — les suivantes
        // échoueront aussi et on économise les appels API
        if (errorType === ERROR_TYPES.NETWORK) {
          console.warn(`[syncQueue] ⏸ Network error — pausing queue processing (${pending.length - synced - failed} remaining)`);
          break;
        }
      } else {
        // Erreur permanente (validation, conflit) → marquer comme échoué définitivement
        await db.syncQueue.update(item.id, {
          status: "failed",
          retryCount: item.retryCount + 1,
          error: errorMsg,
        });
        failed++;
        errors.push(`[${item.type}] ${errorMsg}`);

        if (onProgress) {
          onProgress({ type: item.type, id: item.id, status: "failed_permanent", error: errorMsg, synced, failed, total: pending.length });
        }
      }
    }
  }

  return { synced, failed, errors };
}

/**
 * Exécute une opération en fonction de son type
 */
async function executeOperation(type, payload) {
  switch (type) {
    case OPERATIONS.GRADE_CREATE:
      await recordGrade(payload);
      break;

    case OPERATIONS.GRADE_UPDATE:
      await updateGrade(payload.id, payload.data);
      break;

    case OPERATIONS.ATTENDANCE_BULK:
      await recordBulkAttendance(payload);
      break;

    default:
      throw new Error(`Unknown operation type: ${type}`);
  }
}

/**
 * Retourne le nombre d'opérations en attente
 */
export async function getPendingCount() {
  try {
    return await db.syncQueue
      .where("status")
      .anyOf("pending", "failed")
      .count();
  } catch {
    return 0;
  }
}

/**
 * Retourne un résumé de la file d'attente
 */
export async function getQueueSummary() {
  try {
    const all = await db.syncQueue.toArray();
    const pending = all.filter((i) => i.status === "pending").length;
    const failed = all.filter((i) => i.status === "failed").length;
    const syncing = all.filter((i) => i.status === "syncing").length;

    const byType = {};
    all.forEach((i) => {
      if (i.status === "pending" || i.status === "failed") {
        byType[i.type] = (byType[i.type] || 0) + 1;
      }
    });

    return { total: all.length, pending, failed, syncing, byType };
  } catch {
    return { total: 0, pending: 0, failed: 0, syncing: 0, byType: {} };
  }
}

/**
 * Vide les opérations échouées de la file
 * @param {boolean} [onlyFailed] - Si true, ne supprime que les échouées
 */
export async function clearQueue(onlyFailed = true) {
  try {
    if (onlyFailed) {
      await db.syncQueue.where("status").equals("failed").delete();
    } else {
      await db.syncQueue.clear();
    }
    console.info(`[syncQueue] Queue cleared (onlyFailed: ${onlyFailed})`);
  } catch (err) {
    console.warn("[syncQueue] Failed to clear queue:", err);
  }
}

export { OPERATIONS, classifyError };
export default { addToQueue, processQueue, getPendingCount, getQueueSummary, clearQueue };
