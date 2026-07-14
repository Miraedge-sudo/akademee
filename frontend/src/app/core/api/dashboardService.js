// core/api/dashboardService.js
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Récupère les statistiques du dashboard
 */
export async function getDashboardStats(params = {}) {
  const response = await api.get(API_ENDPOINTS.DASHBOARD.STATS, { params });
  return response.data.data;
}

/**
 * Récupère les activités récentes
 */
export async function getRecentActivities(params = {}) {
  const response = await api.get(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITIES, { params });
  return response.data.data;
}

/**
 * Récupère les données de revenus pour le graphique
 */
export async function getRevenueData(params = {}) {
  const response = await api.get(API_ENDPOINTS.DASHBOARD.REVENUE, { params });
  return response.data.data;
}
