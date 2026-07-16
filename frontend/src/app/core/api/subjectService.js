import api from "./axios";
import { API_ENDPOINTS } from "./endpoints";

// ── Subjects CRUD ──

/**
 * Get all subjects
 * @param {object} params - { limit, offset }
 */
export async function getSubjects(params = {}) {
  const response = await api.get(API_ENDPOINTS.SUBJECTS.LIST, { params });
  return response.data.data;
}

/**
 * Get a single subject
 * @param {string} id
 */
export async function getSubjectById(id) {
  const response = await api.get(API_ENDPOINTS.SUBJECTS.GET(id));
  return response.data.data;
}

/**
 * Create a new subject
 * @param {object} data - { name, code?, coefficient? }
 */
export async function createSubject(data) {
  const response = await api.post(API_ENDPOINTS.SUBJECTS.CREATE, data);
  return response.data.data;
}

/**
 * Update a subject
 * @param {string} id
 * @param {object} data - { name?, coefficient? }
 */
export async function updateSubject(id, data) {
  const response = await api.put(API_ENDPOINTS.SUBJECTS.UPDATE(id), data);
  return response.data.data;
}

/**
 * Delete a subject
 * @param {string} id
 */
export async function deleteSubject(id) {
  const response = await api.delete(API_ENDPOINTS.SUBJECTS.DELETE(id));
  return response.data.data;
}

/**
 * Get subjects for a specific class
 * @param {string} classId
 */
export async function getClassSubjects(classId) {
  const response = await api.get(API_ENDPOINTS.SUBJECTS.CLASS(classId));
  return response.data.data;
}

// ── Subject-Teacher Assignments ──

/**
 * Get all subject-teacher assignments
 */
export async function getSubjectTeacherAssignments() {
  const response = await api.get(API_ENDPOINTS.SUBJECT_TEACHERS.LIST);
  return response.data.data;
}

/**
 * Assign a teacher to a subject
 * @param {object} data - { subjectId, teacherId, classId? }
 */
export async function assignTeacherToSubject(data) {
  const response = await api.post(API_ENDPOINTS.SUBJECT_TEACHERS.ASSIGN, data);
  return response.data.data;
}

/**
 * Get teachers assigned to a subject
 * @param {string} subjectId
 */
export async function getSubjectTeachers(subjectId) {
  const response = await api.get(API_ENDPOINTS.SUBJECT_TEACHERS.BY_SUBJECT(subjectId));
  return response.data.data;
}

/**
 * Get subjects assigned to a teacher
 * @param {string} teacherId
 */
export async function getTeacherSubjects(teacherId) {
  const response = await api.get(API_ENDPOINTS.SUBJECT_TEACHERS.BY_TEACHER(teacherId));
  return response.data.data;
}

/**
 * Remove a subject-teacher assignment
 * @param {string} id - assignment ID
 */
export async function removeTeacherAssignment(id) {
  const response = await api.delete(API_ENDPOINTS.SUBJECT_TEACHERS.DELETE(id));
  return response.data.data;
}

// ── Class-Teacher Assignments ──

/**
 * Get all class-teacher assignments across all classes
 */
export async function getAllClassTeacherAssignments() {
  const response = await api.get(API_ENDPOINTS.CLASS_TEACHERS.LIST_ALL);
  return response.data.data;
}

/**
 * Get teachers assigned to a specific class
 * @param {string} classId
 */
export async function getClassTeachers(classId) {
  const response = await api.get(API_ENDPOINTS.CLASS_TEACHERS.BY_CLASS(classId));
  return response.data.data;
}

/**
 * Assign a teacher to a class
 * @param {string} classId
 * @param {object} data - { teacherId, isMain? }
 */
export async function assignClassTeacher(classId, data) {
  const response = await api.post(API_ENDPOINTS.CLASS_TEACHERS.ASSIGN(classId), data);
  return response.data.data;
}

/**
 * Remove a teacher from a class
 * @param {string} classId
 * @param {string} teacherId
 */
export async function removeClassTeacher(classId, teacherId) {
  const response = await api.delete(API_ENDPOINTS.CLASS_TEACHERS.REMOVE(classId, teacherId));
  return response.data.data;
}

/**
 * Get available teachers (users with TEACHER role)
 */
export async function getAvailableTeachers() {
  const response = await api.get(API_ENDPOINTS.CLASS_TEACHERS.AVAILABLE);
  return response.data.data;
}
