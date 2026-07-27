import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

// ── Academic Years ──

export async function getAcademicYears() {
  const response = await api.get(API_ENDPOINTS.ACADEMIC.YEARS);
  return response.data.data;
}

export async function getAcademicYearById(id) {
  const response = await api.get(API_ENDPOINTS.ACADEMIC.YEAR(id));
  return response.data.data;
}

export async function createAcademicYear(data) {
  const response = await api.post(API_ENDPOINTS.ACADEMIC.YEARS, data);
  return response.data.data;
}

export async function updateAcademicYear(id, data) {
  const response = await api.put(API_ENDPOINTS.ACADEMIC.YEAR(id), data);
  return response.data.data;
}

export async function activateAcademicYear(id) {
  const response = await api.post(API_ENDPOINTS.ACADEMIC.ACTIVATE_YEAR(id));
  return response.data.data;
}

export async function deleteAcademicYear(id) {
  const response = await api.delete(API_ENDPOINTS.ACADEMIC.YEAR(id));
  return response.data.data;
}

// ── Terms / Periods ──

export async function getTerms(params = {}) {
  const response = await api.get(API_ENDPOINTS.ACADEMIC.PERIODS, { params });
  // Normalize: backend wraps in { periods: [...] }
  const data = response.data.data;
  if (data && data.periods) return data.periods;
  return data || [];
}

export async function getTermById(id) {
  const response = await api.get(API_ENDPOINTS.ACADEMIC.PERIOD(id));
  return response.data.data;
}

export async function createTerm(data) {
  const response = await api.post(API_ENDPOINTS.ACADEMIC.PERIODS, data);
  return response.data.data;
}

export async function updateTerm(id, data) {
  const response = await api.put(API_ENDPOINTS.ACADEMIC.PERIOD(id), data);
  return response.data.data;
}

export async function deleteTerm(id) {
  const response = await api.delete(API_ENDPOINTS.ACADEMIC.PERIOD(id));
  return response.data.data;
}

export async function openTerm(id) {
  const response = await api.patch(API_ENDPOINTS.ACADEMIC.PERIOD_OPEN(id));
  return response.data.data;
}

export async function closeTerm(id) {
  const response = await api.patch(API_ENDPOINTS.ACADEMIC.PERIOD_CLOSE(id));
  return response.data.data;
}

export async function lockTerm(id) {
  const response = await api.patch(API_ENDPOINTS.ACADEMIC.PERIOD_LOCK(id));
  return response.data.data;
}

export async function unlockTerm(id) {
  const response = await api.patch(API_ENDPOINTS.ACADEMIC.PERIOD_UNLOCK(id));
  return response.data.data;
}
