import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    // response.success() wraps data -> { success, message, data: actualData }
    if (data.data && typeof data.data === "object") {
      // Case: data.data is { periods: [...] }
      if (Array.isArray(data.data.periods)) return data.data.periods;
      // Case: data.data is itself an array (e.g. sequences)
      if (Array.isArray(data.data)) return data.data;
    }
    // Direct access (no wrapping)
    if (Array.isArray(data.periods)) return data.periods;
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

export const periodService = {
  /**
   * GET /api/periods
   * Liste toutes les périodes de l'école
   */
  list: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.ACADEMIC.PERIODS, { params });
    return extractList(response.data);
  },

  /**
   * GET /api/periods/{id}
   */
  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.ACADEMIC.PERIOD(id));
    return extractEntity(response.data);
  },
};

export default periodService;
