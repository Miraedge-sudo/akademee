/**
 * Grade Service — API calls for grade/marks management.
 */
import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * Get all grades (with optional filters)
 * @param {object} params - { studentId, subjectId, periodId, classId }
 */
export async function getGrades(params = {}) {
  const response = await api.get(API_ENDPOINTS.GRADES.LIST, { params });
  return response.data.data;
}

/**
 * Get grades for a specific student
 * @param {string} studentId
 */
export async function getStudentGrades(studentId) {
  const response = await api.get(API_ENDPOINTS.GRADES.STUDENT(studentId));
  return response.data.data;
}

/**
 * Get grades for a specific class
 * @param {string} classId
 */
export async function getClassGrades(classId) {
  const response = await api.get(API_ENDPOINTS.GRADES.CLASS(classId));
  return response.data.data;
}

/**
 * Get grades for a period + class combination
 * @param {string} periodId
 * @param {string} classId
 */
export async function getPeriodGrades(periodId, classId) {
  const response = await api.get(
    API_ENDPOINTS.GRADES.PERIOD_CLASS(periodId, classId)
  );
  return response.data.data;
}

/**
 * Record a single grade
 * @param {object} data - { studentId, subjectId, periodId?, sequenceId?, score, comment? }
 */
export async function recordGrade(data) {
  const response = await api.post(API_ENDPOINTS.GRADES.CREATE, data);
  return response.data.data;
}

/**
 * Update a grade
 * @param {string} id
 * @param {object} data - { score?, comment? }
 */
export async function updateGrade(id, data) {
  const response = await api.put(API_ENDPOINTS.GRADES.UPDATE(id), data);
  return response.data.data;
}

/**
 * Delete a grade
 * @param {string} id
 */
export async function deleteGrade(id) {
  const response = await api.delete(API_ENDPOINTS.GRADES.DELETE(id));
  return response.data.data;
}

/**
 * Get report card for a student
 * @param {string} studentId
 */
export async function getStudentReport(studentId) {
  const response = await api.get(API_ENDPOINTS.GRADES.REPORT(studentId));
  return response.data.data;
}
