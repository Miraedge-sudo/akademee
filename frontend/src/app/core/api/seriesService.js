import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

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

export const seriesService = {
  list: async () => {
    const response = await api.get(API_ENDPOINTS.SERIES.LIST);
    return extractList(response.data);
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.SERIES.GET(id));
    return extractEntity(response.data);
  },

  create: async ({ name }) => {
    const response = await api.post(API_ENDPOINTS.SERIES.CREATE, { name });
    return extractEntity(response.data);
  },

  update: async (id, { name }) => {
    const response = await api.put(API_ENDPOINTS.SERIES.UPDATE(id), { name });
    return extractEntity(response.data);
  },

  delete: async (id) => {
    await api.delete(API_ENDPOINTS.SERIES.DELETE(id));
  },
};

export default seriesService;
