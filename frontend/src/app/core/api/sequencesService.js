import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Normalise une séquence du backend (label, dateDebut, dateFin, status)
 * vers le format frontend (libelle, dateDebutSaisie, dateFinSaisie, statut)
 */
function normalizeSequence(raw) {
  return {
    id: raw.id,
    libelle: raw.label || raw.libelle || "",
    dateDebutSaisie: raw.dateDebut || raw.dateDebutSaisie || "",
    dateFinSaisie: raw.dateFin || raw.dateFinSaisie || "",
    ordre: raw.ordre || raw.sortOrder || 0,
    statut: raw.status || raw.statut || "EN_ATTENTE",
    periodeId: raw.periodeId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.content)) return data.content;
  }
  return [];
}

function extractEntity(data) {
  if (data && typeof data === "object" && data.data && typeof data.data === "object") {
    return data.data;
  }
  return data;
}

export const sequencesService = {
  /**
   * GET /api/v1/sequences/periode/{periodeId}
   * Liste les séquences d'une période, triées par date de début
   */
  getByPeriodeId: async (periodeId) => {
    if (!periodeId) return [];
    const response = await api.get(API_ENDPOINTS.V1.SEQUENCES_BY_PERIODE(periodeId));
    const list = extractList(response.data);
    return list.map(normalizeSequence).sort((a, b) => a.ordre - b.ordre);
  },

  /**
   * GET /api/v1/sequences/{id}
   */
  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.V1.SEQUENCE(id));
    return normalizeSequence(extractEntity(response.data));
  },

  /**
   * POST /api/v1/sequences
   * Crée une séquence
   */
  create: async ({ libelle, periodeId, dateDebutSaisie, dateFinSaisie }) => {
    const body = {
      label: libelle,
      periodeId,
      dateDebut: dateDebutSaisie,
      dateFin: dateFinSaisie,
    };
    const response = await api.post(API_ENDPOINTS.V1.SEQUENCES, body);
    return normalizeSequence(extractEntity(response.data));
  },

  /**
   * PUT /api/v1/sequences/{id}
   * Modifie une séquence (label, dateDebut, dateFin)
   */
  update: async (id, { libelle, dateDebutSaisie, dateFinSaisie }) => {
    const body = {
      label: libelle,
      dateDebut: dateDebutSaisie,
      dateFin: dateFinSaisie,
    };
    const response = await api.put(API_ENDPOINTS.V1.SEQUENCE(id), body);
    return normalizeSequence(extractEntity(response.data));
  },

  /**
   * DELETE /api/v1/sequences/{id}
   * Supprime une séquence (uniquement si EN_ATTENTE)
   */
  delete: async (id) => {
    await api.delete(API_ENDPOINTS.V1.SEQUENCE(id));
  },

  /**
   * PATCH /api/v1/sequences/{id}/open
   * EN_ATTENTE → OUVERTE
   */
  open: async (id) => {
    const response = await api.patch(API_ENDPOINTS.V1.SEQUENCE_OPEN(id));
    return normalizeSequence(extractEntity(response.data));
  },

  /**
   * PATCH /api/v1/sequences/{id}/close
   * OUVERTE → FERMEE
   */
  close: async (id) => {
    const response = await api.patch(API_ENDPOINTS.V1.SEQUENCE_CLOSE(id));
    return normalizeSequence(extractEntity(response.data));
  },

  /**
   * PATCH /api/v1/sequences/{id}/lock
   * OUVERTE|FERMEE → VERROUILLEE
   */
  lock: async (id) => {
    const response = await api.patch(API_ENDPOINTS.V1.SEQUENCE_LOCK(id));
    return normalizeSequence(extractEntity(response.data));
  },

  /**
   * PATCH /api/v1/sequences/{id}/unlock
   * VERROUILLEE → OUVERTE
   */
  unlock: async (id) => {
    const response = await api.patch(API_ENDPOINTS.V1.SEQUENCE_UNLOCK(id));
    return normalizeSequence(extractEntity(response.data));
  },
};

export default sequencesService;
