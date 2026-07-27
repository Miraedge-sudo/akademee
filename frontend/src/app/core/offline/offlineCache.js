import db from "./db";

/**
 * Stratégie NetworkFirst pour le cache hors ligne
 *
 * 1. Tente un appel API via `fetchFn`
 * 2. En cas de succès → sauvegarde dans IndexedDB et retourne la donnée fraîche
 * 3. En cas d'échec réseau → charge depuis IndexedDB et retourne la donnée en cache
 * 4. Si rien en cache → propage l'erreur
 */

// ── Helpers : normaliser un tableau depuis divers formats API ──
function ensureArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    // { success, message, data: [...] }
    if (data.data && Array.isArray(data.data)) return data.data;
    // { data: { students: [...] } }
    if (data.data && typeof data.data === "object") {
      for (const key of Object.keys(data.data)) {
        if (Array.isArray(data.data[key])) return data.data[key];
      }
    }
    // { students: [...] }
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) return data[key];
    }
  }
  return data;
}

/**
 * networkFirst — tente le réseau, puis le cache local
 *
 * @param {object} options
 * @param {string}  options.table     - Nom de la table Dexie
 * @param {() => Promise<any>} options.fetchFn - Fonction d'appel API
 * @param {(data: any) => any[]} [options.mapFn] - Transforme la réponse en tableau pour le cache
 * @param {number}  [options.ttlMs]   - Durée de validité du cache (ms) — non utilisé pour l'instant
 * @returns {Promise<any>}
 *
 * @example
 * const students = await networkFirst({
 *   table: 'students',
 *   fetchFn: () => getStudents(),
 *   mapFn: (res) => res.map(s => ({ id: s.id, ...s })),
 * });
 */
export async function networkFirst(options) {
  const { table, fetchFn, mapFn } = options;
  let networkError = null;

  try {
    // 1. Toujours tenter le réseau en premier
    const response = await fetchFn();
    const rawData = response?.data || response;

    // 2. Sauvegarder dans IndexedDB
    if (table && rawData !== undefined && rawData !== null) {
      const items = mapFn ? mapFn(rawData) : ensureArray(rawData);
      if (Array.isArray(items) && items.length > 0) {
        // On efface et on réinsère (stratégie "bulk replace" simple)
        await db[table].clear();
        // Dexie bulkAdd attend un tableau d'objets
        await db[table].bulkAdd(items);
      }
      // Marquer la synchro
      await db.syncMeta.put({ tableName: table, lastSync: Date.now() });
    }

    return rawData;
  } catch (err) {
    networkError = err;

    // 3. Échec réseau → tenter le cache local
    if (table) {
      try {
        const cached = await db[table].toArray();
        if (cached.length > 0) {
          console.info(`[offline] Serving "${table}" from cache (${cached.length} items)`);
          return cached;
        }
      } catch (dbErr) {
        console.warn(`[offline] Cache read failed for "${table}":`, dbErr);
      }
    }

    // 4. Rien en cache → propager l'erreur originale
    throw networkError;
  }
}

/**
 * getLastSync — retourne la date de dernière synchronisation pour une table
 * @param {string} tableName
 * @returns {Promise<Date|null>}
 */
export async function getLastSync(tableName) {
  try {
    const meta = await db.syncMeta.get(tableName);
    return meta?.lastSync ? new Date(meta.lastSync) : null;
  } catch {
    return null;
  }
}

/**
 * clearCache — vide tout le cache IndexedDB (utile pour le logout / reset)
 */
export async function clearCache() {
  const tableNames = db.tables.map((t) => t.name);
  await Promise.all(tableNames.map((name) => db[name].clear()));
  console.info("[offline] Cache cleared");
}

export default { networkFirst, getLastSync, clearCache };
