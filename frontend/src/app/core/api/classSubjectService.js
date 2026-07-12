import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

/**
 * List all class-subject assignments
 */
export async function getClassSubjects(params = {}) {
  const response = await api.get(API_ENDPOINTS.ACADEMIC.CLASS_SUBJECTS, { params });
  return response.data.data;
}

/**
 * Get subjects assigned to a specific class
 * @param {string} classId
 */
export async function getClassSubjectsByClass(classId) {
  const response = await api.get(API_ENDPOINTS.ACADEMIC.CLASS_SUBJECTS_BY_CLASS(classId));
  return response.data.data;
}

/**
 * Assign a subject to a class
 * @param {object} data - { classId, subjectId, coefficient?, isCompulsory? }
 */
export async function assignSubjectToClass(data) {
  const response = await api.post(API_ENDPOINTS.ACADEMIC.CLASS_SUBJECTS, data);
  return response.data.data;
}

/**
 * Bulk assign subjects to a class
 * @param {string} classId
 * @param {string[]} subjectIds
 */
export async function bulkAssignSubjects(classId, subjectIds) {
  const response = await api.post(`${API_ENDPOINTS.ACADEMIC.CLASS_SUBJECTS}/bulk`, {
    classId,
    subjectIds,
  });
  return response.data.data;
}

/**
 * Remove a subject from a class
 * @param {string} assignmentId
 */
export async function removeSubjectFromClass(assignmentId) {
  const response = await api.delete(`${API_ENDPOINTS.ACADEMIC.CLASS_SUBJECTS}/${assignmentId}`);
  return response.data.data;
}
