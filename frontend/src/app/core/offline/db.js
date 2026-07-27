import Dexie from "dexie";

/**
 * Akademee Offline Database — IndexedDB via Dexie.js
 *
 * Stores cached API data for offline access.
 * Each table mirrors a key API resource.
 *
 * Tables:
 * ────────────────────────────────────────────
 * students   │ id, classId, status, schoolId
 * classes    │ id, name, levelId
 * subjects   │ id, name, code
 * periods    │ id, label, statut, schoolId
 * sequences  │ id, libelle, periodeId, statut, ordre
 * syncQueue  │ ++id, type, status, createdAt
 *               (file d'attente d'écriture hors ligne)
 * syncMeta   │ tableName  (last-sync timestamp per table)
 */
const db = new Dexie("akademee-cache");

db.version(1).stores({
  students: "id, classId, status, schoolId",
  classes: "id, name, levelId",
  subjects: "id, name, code",
  periods: "id, *label, statut, schoolId",
  sequences: "id, libelle, periodeId, statut, ordre",
  syncMeta: "tableName",
});

db.version(2).stores({
  students: "id, classId, status, schoolId",
  classes: "id, name, levelId",
  subjects: "id, name, code",
  periods: "id, *label, statut, schoolId",
  sequences: "id, libelle, periodeId, statut, ordre",
  syncQueue: "++id, type, status, createdAt",
  syncMeta: "tableName",
});

export default db;
