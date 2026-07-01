// core/api/websiteService.js
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Récupère les données publiques du site vitrine d'une école.
 * Pas besoin de token — accessible à tous.
 * @param {string} subdomain
 */
export async function getPublicWebsite(subdomain) {
  const response = await api.get(API_ENDPOINTS.WEBSITE.PUBLIC, {
    params: { subdomain },
  });
  return response.data.data;
}

/**
 * Récupère les données d'onboarding de l'école connectée.
 * Requiert un token JWT.
 */
export async function getOnboardingData() {
  const response = await api.get(API_ENDPOINTS.SCHOOLS.ONBOARDING);
  return response.data.data;
}

/**
 * Sauvegarde les données d'onboarding.
 * @param {object} payload
 */
export async function saveOnboardingData(payload) {
  const response = await api.put(API_ENDPOINTS.SCHOOLS.ONBOARDING, payload);
  return response.data;
}

/**
 * Upload un média (logo, hero, gallery).
 * @param {File} file
 * @param {"logo"|"hero"|"gallery"} mediaType
 * @param {number} sortOrder - optionnel, pour gallery
 */
export async function uploadMedia(file, mediaType, sortOrder = 0) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("mediaType", mediaType);
  if (mediaType === "gallery") {
    formData.append("sortOrder", sortOrder);
  }
  const response = await api.post(
    API_ENDPOINTS.SCHOOLS.ONBOARDING_MEDIA,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data.data;
}

/**
 * Récupère la liste des templates disponibles.
 */
export async function getTemplates() {
  const response = await api.get(API_ENDPOINTS.SCHOOLS.TEMPLATES);
  return response.data.data;
}

/**
 * Récupère la liste des plans disponibles.
 */
export async function getPlans() {
  const response = await api.get(API_ENDPOINTS.SCHOOLS.PLANS);
  return response.data.data;
}