/**
 * Attendance Service — API calls for attendance management.
 */
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Get attendance for a class on a specific date
 * @param {string} classId
 * @param {string} date - YYYY-MM-DD format
 */
export async function getClassAttendanceByDate(classId, date) {
  const response = await api.get(
    API_ENDPOINTS.ATTENDANCE.CLASS_DATE(classId, date)
  );
  return response.data.data;
}

/**
 * Get all attendance records for a class
 * @param {string} classId
 */
export async function getClassAttendanceAll(classId) {
  const response = await api.get(API_ENDPOINTS.ATTENDANCE.CLASS(classId));
  return response.data.data;
}

/**
 * Record attendance for a single student
 * @param {object} data - { studentId, classId?, date, status, remarks? }
 */
export async function recordAttendance(data) {
  const response = await api.post(API_ENDPOINTS.ATTENDANCE.CREATE, data);
  return response.data.data;
}

/**
 * Bulk record attendance for a class on a date
 * @param {object} data - { classId, date, records: [{ studentId, status }] }
 */
export async function recordBulkAttendance(data) {
  const response = await api.post(API_ENDPOINTS.ATTENDANCE.BULK, data);
  return response.data.data;
}

/**
 * Get attendance statistics
 * @param {object} params
 */
export async function getAttendanceStats(params = {}) {
  const response = await api.get(API_ENDPOINTS.ATTENDANCE.STATISTICS, { params });
  return response.data.data;
}

/**
 * Update an attendance record
 * @param {string} id
 * @param {object} data - { status?, remarks? }
 */
export async function updateAttendance(id, data) {
  const response = await api.put(API_ENDPOINTS.ATTENDANCE.UPDATE(id), data);
  return response.data.data;
}
