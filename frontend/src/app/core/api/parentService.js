/**
 * Parent Service — API calls for the parent portal
 */
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Get the children (students) of the currently logged-in parent
 * The backend matches by the parent's email in the guardians table.
 */
export async function getMyChildren() {
  const response = await api.get("/api/guardians/me/children");
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
