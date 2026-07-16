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

export const levelService = {
  list: async () => {
    const response = await api.get(API_ENDPOINTS.LEVELS.LIST);
    return extractList(response.data);
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.LEVELS.GET(id));
    return extractEntity(response.data);
  },

  create: async ({ name, order }) => {
    const response = await api.post(API_ENDPOINTS.LEVELS.CREATE, { name, order });
    return extractEntity(response.data);
  },

  update: async (id, { name, order }) => {
    const response = await api.put(API_ENDPOINTS.LEVELS.UPDATE(id), { name, order });
    return extractEntity(response.data);
  },

  delete: async (id) => {
    await api.delete(API_ENDPOINTS.LEVELS.DELETE(id));
  },
};

export default levelService;
