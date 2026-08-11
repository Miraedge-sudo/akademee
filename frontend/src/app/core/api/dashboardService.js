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

/**
 * Récupère les statistiques finance détaillées (monthly collections,
 * collection by class, outstanding alerts, fee status overview)
 */
export async function getFinanceStats() {
  const response = await api.get(API_ENDPOINTS.DASHBOARD.FINANCE_STATS);
  return response.data.data;
}

/**
 * Télécharge le PDF « situation financière du campus » (rendu serveur),
 * destiné à être remis à l'administration.
 *
 * @param {string} [lang] - 'fr' | 'en'
 * @returns {Promise<{blob: Blob, filename: string}>}
 */
export async function downloadFinancialStatementPdf(lang = "fr") {
  const response = await api.get(API_ENDPOINTS.REPORTS.FINANCIAL_STATEMENT_PDF, {
    params: { lang },
    responseType: "blob",
    timeout: 60000,
  });

  const disposition = response.headers?.["content-disposition"] || "";
  let filename = `financial-statement-${new Date().toISOString().slice(0, 10)}.pdf`;
  const match = disposition.match(/filename="?([^";]+)"?/i);
  if (match) filename = match[1];

  return { blob: response.data, filename };
}
