/**
 * Message Service — API calls for campus message management (admin side)
 */
import api from "./axios";

export async function getCampusMessages(params = {}) {
  const response = await api.get("/api/messages", { params });
  return response.data.data;
}

export async function getCampusMessageThread(id) {
  const response = await api.get(`/api/messages/${id}`);
  return response.data.data;
}

export async function replyToCampusMessage(id, payload) {
  const response = await api.post(`/api/messages/${id}/reply`, payload);
  return response.data.data;
}

export async function updateCampusMessageStatus(id, status) {
  const response = await api.patch(`/api/messages/${id}/status`, { status });
  return response.data.data;
}
