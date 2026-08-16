// core/api/notificationService.js
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Liste les notifications de l'utilisateur connecté.
 * Retourne { notifications, total, limit, offset }.
 */
export async function getNotifications(params = {}) {
  const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { params });
  return response.data.data;
}

/** Marque une notification comme lue. */
export async function markNotificationRead(id) {
  const response = await api.put(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
  return response.data.data;
}

/** Supprime une notification. */
export async function deleteNotification(id) {
  const response = await api.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
  return response.data.data;
}

/** Nombre de notifications non lues. Retourne { count }. */
export async function getUnreadCount() {
  const response = await api.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
  return response.data.data;
}

/**
 * Envoie une notification (admin).
 *
 * @param {object} data - { message, type?, audience?, userId?, role?, classId? }
 *   audience: 'user' (userId requis) | 'all' | 'role' (role requis) | 'class' (classId requis)
 * Retourne { sent, recipients }.
 */
export async function sendNotification(data) {
  const response = await api.post(API_ENDPOINTS.NOTIFICATIONS.SEND, data);
  return response.data.data;
}
