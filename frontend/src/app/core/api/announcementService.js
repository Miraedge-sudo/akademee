// core/api/announcementService.js
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Récupère les annonces publiées pour le site vitrine (public, no auth).
 * @param {string} subdomain
 */
export async function getPublicAnnouncements(subdomain) {
  const response = await api.get(API_ENDPOINTS.ANNOUNCEMENTS.PUBLIC, {
    params: { subdomain },
  });
  return response.data.data;
}

/**
 * Récupère toutes les annonces (admin).
 */
export async function getAnnouncements(params = {}) {
  const response = await api.get(API_ENDPOINTS.ANNOUNCEMENTS.LIST, { params });
  return response.data.data;
}

/**
 * Récupère une annonce par ID.
 * @param {number|string} id
 */
export async function getAnnouncement(id) {
  const response = await api.get(API_ENDPOINTS.ANNOUNCEMENTS.GET(id));
  return response.data.data;
}

/**
 * Crée une nouvelle annonce.
 * @param {object} data - { title, content, targetAudience, priority, isPublished }
 */
export async function createAnnouncement(data) {
  const response = await api.post(API_ENDPOINTS.ANNOUNCEMENTS.CREATE, data);
  return response.data.data;
}

/**
 * Met à jour une annonce.
 * @param {number|string} id
 * @param {object} data
 */
export async function updateAnnouncement(id, data) {
  const response = await api.put(API_ENDPOINTS.ANNOUNCEMENTS.UPDATE(id), data);
  return response.data.data;
}

/**
 * Supprime une annonce.
 * @param {number|string} id
 */
export async function deleteAnnouncement(id) {
  const response = await api.delete(API_ENDPOINTS.ANNOUNCEMENTS.DELETE(id));
  return response.data.data;
}

/**
 * Publie une annonce.
 * @param {number|string} id
 */
export async function publishAnnouncement(id) {
  const response = await api.post(API_ENDPOINTS.ANNOUNCEMENTS.PUBLISH(id));
  return response.data.data;
}

/**
 * Dé-publie une annonce.
 * @param {number|string} id
 */
export async function unpublishAnnouncement(id) {
  const response = await api.post(API_ENDPOINTS.ANNOUNCEMENTS.UNPUBLISH(id));
  return response.data.data;
}
