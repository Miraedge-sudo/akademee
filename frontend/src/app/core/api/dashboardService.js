// core/api/dashboardService.js
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Récupère les statistiques du dashboard
 */
export async function getDashboardStats() {
  const response = await api.get(API_ENDPOINTS.DASHBOARD.STATS);
  return response.data.data;
}

/**
 * Récupère les activités récentes
 */
export async function getRecentActivities() {
  const response = await api.get(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITIES);
  return response.data.data;
}

/**
 * Récupère les données de revenus pour le graphique
 */
export async function getRevenueData() {
  const response = await api.get(API_ENDPOINTS.DASHBOARD.REVENUE);
  return response.data.data;
}
