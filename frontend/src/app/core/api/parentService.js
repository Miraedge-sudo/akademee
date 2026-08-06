/**
 * Parent Service — API calls for the parent portal
 */
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Get the children (students) of the currently logged-in parent
 * The backend matches by the parent's email or linked user account in the guardians table.
 */
export async function getMyChildren() {
  const response = await api.get("/api/guardians/me/children");
  return response.data.data;
}

/**
 * Fees for all children (with per-fee breakdown + totals).
 */
export async function getMyFees(params = {}) {
  const response = await api.get("/api/parent/fees", { params });
  return response.data.data;
}

/**
 * Pay a fee for one of the parent's children.
 */
export async function payFee(payload) {
  const response = await api.post("/api/parent/fees/pay", payload);
  return response.data.data;
}

/**
 * Payment history for all children.
 */
export async function getMyPayments(params = {}) {
  const response = await api.get("/api/parent/payments", { params });
  return response.data.data;
}

/**
 * Messages this parent sent to the campus.
 */
export async function getMyMessages() {
  const response = await api.get("/api/parent/messages");
  return response.data.data;
}

/**
 * Full thread for one of the parent's messages.
 */
export async function getMyMessageThread(id) {
  const response = await api.get(`/api/parent/messages/${id}`);
  return response.data.data;
}

/**
 * Send a new message to the campus.
 */
export async function sendCampusMessage(payload) {
  const response = await api.post("/api/parent/messages", payload);
  return response.data.data;
}

/**
 * Reply to one of the parent's message threads.
 */
export async function replyToMessage(id, payload) {
  const response = await api.post(`/api/parent/messages/${id}/reply`, payload);
  return response.data.data;
}

/**
 * Get a comprehensive dashboard for a single child
 * Aggregates fee summary, latest grades, attendance stats, and announcements.
 */
export async function getChildDashboard(studentId) {
  const [fees, grades, attendance, announcements] = await Promise.all([
    api.get(API_ENDPOINTS.FEE_CALCULATIONS.STUDENT_SUMMARY(studentId)).then(r => r.data.data).catch(() => null),
    api.get(`/api/grades/student/${studentId}`).then(r => r.data.data).catch(() => null),
    api.get(`/api/attendance/student/${studentId}`).then(r => r.data.data).catch(() => null),
    api.get(API_ENDPOINTS.ANNOUNCEMENTS.LIST).then(r => r.data.data).catch(() => []),
  ]);
  return { fees, grades, attendance, announcements };
}
