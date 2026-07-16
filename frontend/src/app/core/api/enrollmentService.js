import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Create a new enrollment
 * @param {object} data - { studentId, classId, academicYearId? }
 */
export async function createEnrollment(data) {
  const response = await api.post(API_ENDPOINTS.ENROLLMENTS.CREATE, data);
  return response.data.data;
}

/**
 * Get all enrollments (with optional filters)
 * @param {object} params - { classId, status, academicYearId, limit, offset }
 */
export async function getEnrollments(params = {}) {
  const response = await api.get(API_ENDPOINTS.ENROLLMENTS.LIST, { params });
  return response.data.data;
}

/**
 * Get enrollments for a specific student
 * @param {string} studentId
 */
export async function getStudentEnrollments(studentId) {
  const response = await api.get(API_ENDPOINTS.ENROLLMENTS.BY_STUDENT(studentId));
  return response.data.data;
}

/**
 * Get a single enrollment by ID
 * @param {string} id
 */
export async function getEnrollmentById(id) {
  const response = await api.get(API_ENDPOINTS.ENROLLMENTS.GET(id));
  return response.data.data;
}
